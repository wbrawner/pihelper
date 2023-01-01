import express from 'express'
import ws from 'ws'
import http from 'http'

const port = process.env.PIHELPER_PORT || 3000;
const pihole = process.env.PIHELPER_PIHOLE_HOST || 'http://pi.hole';
const apiKey: string = process.env.PIHELPER_API_KEY || '';

if (apiKey === '') {
    console.error("PIHELPER_API_KEY not set, aborting")
    process.exit(1)
}

const app = express();
const wss = new ws.Server({ noServer: true });
const clients: Array<ws> = []
wss.on('connection', socket => {
    clients.push(socket)
    socket.on('close', () => {
        const index = clients.indexOf(socket);
        if (index > -1) {
            delete clients[index];
        }
    })
    socket.on('message', message => {
        const command = JSON.parse(message.toString())
        switch (command.action) {
            case 'status':
                status(status => {
                    clients.forEach(client => {
                        client.send(status)
                    })
                })
                break
            case 'enable':
                enable(status => {
                    clients.forEach(client => {
                        client.send(status)
                    })
                })
                break
            case 'disable':
                disable(command.duration, status => {
                    clients.forEach(client => {
                        client.send(status)
                    })
                })
                break
            default:
                socket.send(`{"error": "Invalid command sent: '${command.action}'"}`)
        }
    })
    status(status => {
        clients.forEach(client => {
            client.send(status)
        })
    })
})

// TODO: Handle errors better than this
function get(url: URL, callback: (data: string) => void, error?: (error?: Error) => void) {
    const req = http.request(url, res => {
        res.on('data', data => {
            callback(data.toString())
        })
    })
    req.on('response', res => {
        if (res.statusCode != 200 && error) {
            error()
        }
    })
    req.on('error', e => {
        console.error(`Failed to send GET request to ${url}`, e)
        if (error) {
            error(e)
        }
    })
    req.end()
}

function status(callback: (status: any) => void) {
    let url = new URL(`${pihole}/admin/api.php`)
    url.searchParams.append('auth', apiKey)
    url.searchParams.append('summary', '')
    console.log(`GET ${url.toString()}`)
    get(url, data => {
        let dataObj = JSON.parse(data)
        if (dataObj.status === 'disabled') {
            url = new URL(`${pihole}/custom_disable_timer`)
            get(url, timestamp => {
                dataObj["until"] = Number.parseInt(timestamp)
                callback(JSON.stringify(dataObj))
            }, e => {
                callback(data)
            })
        } else {
            callback(data)
        }
    })
}

function enable(callback: (status: any) => void) {
    let url = new URL(`${pihole}/admin/api.php`)
    url.searchParams.append('enable', '')
    url.searchParams.append('auth', apiKey)
    get(url, callback)
}

function disable(duration?: number, callback?: (status: any) => void) {
    let url = new URL(`${pihole}/admin/api.php`)
    url.searchParams.append('auth', apiKey)
    url.searchParams.append('disable', duration?.toString() ?? '')
    get(url, (data) => {
        url = new URL(`${pihole}/custom_disable_timer`)
        if (duration === undefined) {
            callback?.call(callback, data)
            return
        }
        get(url, (timestamp) => {
            let dataObj = JSON.parse(data)
            dataObj["until"] = Number.parseInt(timestamp)
            callback?.call(callback, JSON.stringify(dataObj))
        })
    })
}

app.use(express.static('./public'))

const server = app.listen(port, () => {
    console.info(`Pi-helper listening on port ${port}`)
})

server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, socket => {
        wss.emit('connection', socket, req)
    })
})