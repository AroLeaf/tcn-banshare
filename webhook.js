module.exports = {
  send(url, msg) {
    if (!msg.files?.length) return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });

    const formdata = new FormData();
    
    formdata.append('payload_json', JSON.stringify({
      ...msg,
      files: undefined,
      attachments: msg.files.map((file, i) => ({
        ...file,
        id: i,
        attachment: undefined,
      })),
    }));
    
    for (const i in msg.files) {
      formdata.append(`files[${i}]`, new Blob([msg.files[i].attachment]), msg.files[i].filename);
    }

    return fetch(url, {
      method: 'POST',
      body: formdata,
    });
  }
}