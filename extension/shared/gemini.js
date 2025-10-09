const apiKey = 'AIzaSyAVG_uJrEm5mtCgajxTMtOIdz6O96HCLHM'; // Replace with your actual key or inject securely

// REST-based Gemini audio transcription using fetch
// Returns a Promise that resolves to the transcript text or throws on error
function geminiTranscribeFile(file, prompt) {
  prompt = prompt || 'Generate a transcript of the speech.';
  var displayName = file.name || 'AUDIO';
  var mimeType = file.type || 'audio/mpeg';
  var numBytes = file.size;

  // 1. Start resumable upload
  return fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(numBytes),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: displayName } })
  })
  .then(function(startRes) {
    console.log('[Gemini] Start upload response:', startRes);
    if (!startRes.ok) throw new Error('Failed to start upload: ' + startRes.status);
    var uploadUrl = startRes.headers.get('X-Goog-Upload-URL');
    if (!uploadUrl) throw new Error('Failed to get upload URL from Gemini API');
    // 2. Upload the actual bytes
    return fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': String(numBytes),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: file
    });
  })
  .then(function(uploadRes) {
    console.log('[Gemini] Upload bytes response:', uploadRes);
    if (!uploadRes.ok) throw new Error('Failed to upload file: ' + uploadRes.status);
    return uploadRes.json();
  })
  .then(function(fileInfo) {
    console.log('[Gemini] File info:', fileInfo);
    var fileUri = fileInfo.file && fileInfo.file.uri;
    if (!fileUri) throw new Error('Failed to get file URI from Gemini API');
    // 3. Generate content using the uploaded file
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { file_data: { mime_type: mimeType, file_uri: fileUri } }
          ]
        }]
      })
    });
  })
  .then(function(genRes) {
    console.log('[Gemini] Generate content response:', genRes);
    if (!genRes.ok) throw new Error('Failed to generate content: ' + genRes.status);
    return genRes.json();
  })
  .then(function(genJson) {
    console.log('[Gemini] Generate content JSON:', genJson);
    var candidates = genJson.candidates || [];
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c.content && c.content.parts) {
        for (var j = 0; j < c.content.parts.length; j++) {
          var part = c.content.parts[j];
          if (part.text) return part.text;
        }
      }
    }
    throw new Error('No transcript found in Gemini response');
  })
  .catch(function(err) {
    console.error('[Gemini] Error:', err);
    throw err;
  });
}
window.geminiTranscribeFile = geminiTranscribeFile;
