let socket: WebSocket | null = null;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/js/sw.js', { 'scope': '/' })
        .then(function (registration) {
            console.log('Registration successful, scope is:', registration.scope);
        })
        .catch(function (error) {
            console.log('Service worker registration failed, error:', error);
        });
}


function monitorChanges() {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${protocol}://${location.host}/`)
    socket.onopen = (e) => {
        console.log('socket opened', e)
    }

    socket.onmessage = (e) => {
        const data = JSON.parse(e.data)
        console.log('message received', data)
        switch (data.status) {
            case 'enabled':
                if (durationInterval) {
                    clearInterval(durationInterval)
                }
                animateLogo(false)
                showDisable(false)
                showEnable(true)
                break
            case 'disabled':
                animateLogo(false)
                showEnable(false, false)
                showDisable(true, data.until)
                break
            default:
                console.error('Unhandled status', data)
        }
    }

    socket.onclose = (e) => {
        console.log('socket closed', e)
        setTimeout(monitorChanges, 1000)
    }

    socket.onerror = (e) => {
        console.error('socket error', e)
    }
}

function enable() {
    if (!socket) return;
    showDisable(false)
    animateLogo(true)
    const command = { action: 'enable' };
    socket.send(JSON.stringify(command))
}

function disable(duration: number) {
    if (!socket) return;
    showEnable(false)
    animateLogo(true)
    const command = { action: 'disable', duration: duration };
    socket.send(JSON.stringify(command))
}

function setUnit(unit: string) {
    const unitInput = document.getElementById('unit') as HTMLInputElement
    const units = document.getElementsByClassName('unit')
    for (let i = 0; i < units.length; i++) {
        if (units[i].id === unit) {
            units[i].classList.add('selected')
        } else {
            units[i].classList.remove('selected')
        }
    }
    unitInput.value = unit
}

function disableCustom() {

    showEnable(false, false)
}

function animateLogo(animate: boolean) {
    const logo = document.getElementById('logo') as HTMLElement
    if (animate) {
        logo.classList.add('spin')
    } else {
        logo.classList.remove('spin')
    }
}

function showEnable(show: boolean, showCustom?: boolean) {
    const enableDiv = document.getElementById('enabled') as HTMLElement
    const disableCustom = document.getElementById('disable-custom') as HTMLElement
    if (show) {
        if (disableCustom.style.opacity === '1') {
            disableCustom.style.opacity = '0'
            setTimeout(() => {
                disableCustom.style.maxHeight = '0'
                enableDiv.style.maxHeight = '100vh'
            }, 250)
            setTimeout(() => {
                enableDiv.style.opacity = '1'
            }, 500)
        } else {
            enableDiv.style.maxHeight = '100vh'
            setTimeout(() => {
                enableDiv.style.opacity = '1'
            }, 250)
        }
    } else {
        enableDiv.style.opacity = '0'
        setTimeout(() => {
            enableDiv.style.maxHeight = '0'
        }, 250)
        if (showCustom) {
            setTimeout(() => {
                disableCustom.style.maxHeight = '100vh'
            }, 250)
            setTimeout(() => {
                disableCustom.style.opacity = '1'
            }, 500)
        }
    }
}

let durationInterval: any;

function showDisable(show: boolean, timestamp?: number) {
    const disableDiv = document.getElementById('disabled') as HTMLElement
    if (show) {
        disableDiv.style.maxHeight = '100vh'
    } else {
        disableDiv.style.opacity = '0'
    }
    setTimeout(() => {
        if (show) {
            disableDiv.style.opacity = '1'
        } else {
            disableDiv.style.maxHeight = '0'
        }
    }, 250)
    const duration = document.getElementById('duration') as HTMLElement
    if (!timestamp) {
        duration.innerText = ''
        return
    }
    const until = new Date(timestamp)
    function updateDuration() {
        const now = new Date();
        const difference = until.getTime() - now.getTime();
        if (durationInterval && difference <= 0) {
            duration.innerText = ''
            clearInterval(durationInterval)
            if (socket) {
                const command = { action: 'status' };
                socket.send(JSON.stringify(command))
            }
            return
        }
        let seconds = Math.ceil(difference / 1000)
        console.log(`${until.getTime()} - ${now.getTime()} = ${seconds} seconds`)
        let hours = 0
        let minutes = 0
        let durationText: string = '';
        if (seconds >= 3600) {
            hours = Math.floor(seconds / 3600)
            seconds -= hours * 3600
        }
        console.log(`hours: ${hours} seconds: ${seconds}`)
        if (seconds >= 60) {
            minutes = Math.floor(seconds / 60)
            seconds -= minutes * 60
        }
        console.log(`minutes: ${minutes} seconds: ${seconds}`)
        if (hours > 0) {
            durationText += `${hours.toString().padStart(2, '0')}:`
        }
        durationText += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        duration.innerText = ` (${durationText})`
    }
    durationInterval = setInterval(updateDuration, 1000)
}