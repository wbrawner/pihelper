let socket: WebSocket | null = null;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
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
        if (window.location.search === '?enable') {
            enable();
        } else if (window.location.search.startsWith('?disable')) {
            const duration = window.location.search.split('=')[1];
            disable(Number.parseInt(duration));
        }
        window.history.replaceState(null, '', window.location.pathname);
    }

    let timeout: NodeJS.Timeout | null = null;
    socket.onmessage = (e) => {
        if (timeout) {
            clearTimeout(timeout!);
        }
        const data = JSON.parse(e.data)
        switch (data.status) {
            case 'enabled':
                if (durationInterval) {
                    clearInterval(durationInterval)
                }
                animateLogo(false)
                showDisable(false)
                timeout = setTimeout(() => {
                    showEnable(true);
                    timeout = null;
                }, 500)
                break
            case 'disabled':
                animateLogo(false)
                showEnable(false, false)
                timeout = setTimeout(() => {
                    showDisable(true, data.until)
                    timeout = null;
                }, 500)
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
    const durationString = (document.getElementById('disable-duration') as HTMLInputElement).value
    const unitInput = document.getElementById('unit') as HTMLInputElement
    let modifier = 0
    if (unitInput.value === 'minutes') {
        modifier = 1
    } else if (unitInput.value === 'hours') {
        modifier = 2
    }
    disable(Math.pow(60, modifier) * Number.parseInt(durationString))
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
        if (disableCustom.classList.contains('visible')) {
            disableCustom.classList.replace('visible', 'hidden');
            setTimeout(() => {
                enableDiv.classList.add('visible')
                enableDiv.classList.remove('hidden')
            }, 500)
        } else {
            enableDiv.classList.add('visible')
            enableDiv.classList.remove('hidden')
        }
    } else {
        enableDiv.classList.replace('visible', 'hidden')
        if (showCustom) {
            setTimeout(() => {
                disableCustom.classList.add('visible')
                disableCustom.classList.remove('hidden')
            }, 250)
        } else {
            disableCustom.classList.replace('visible', 'hidden')
        }
    }
}

let durationInterval: any;

function showDisable(show: boolean, timestamp?: number) {
    const disableDiv = document.getElementById('disabled') as HTMLElement
    if (show) {
        disableDiv.classList.add('visible');
        disableDiv.classList.remove('hidden');
    } else {
        disableDiv.classList.replace('visible', 'hidden');
    }
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
        let hours = 0
        let minutes = 0
        let durationText: string = '';
        if (seconds >= 3600) {
            hours = Math.floor(seconds / 3600)
            seconds -= hours * 3600
        }
        if (seconds >= 60) {
            minutes = Math.floor(seconds / 60)
            seconds -= minutes * 60
        }
        if (hours > 0) {
            durationText += `${hours.toString().padStart(2, '0')}:`
        }
        durationText += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        duration.innerText = ` (${durationText})`
    }
    durationInterval = setInterval(updateDuration, 1000)
}