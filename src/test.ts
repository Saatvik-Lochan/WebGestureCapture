import { backend_url } from "./http_handler"

async function sendFormData() {
    var binary = new Uint8Array(2)
    binary[0] = 65
    binary[1] = 66

    var fd = new FormData()
    fd.append('json_data', JSON.stringify({a: 1, b: 2}))
    fd.append('data', new Blob([binary.buffer]))

    return await fetch(`${backend_url}test/form-data`, {
        method: 'POST',
        body: fd
    })
}

export { sendFormData }