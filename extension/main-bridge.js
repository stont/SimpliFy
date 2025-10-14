window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'summary-panel') {
    alert('Received from sidepanel: ' + (event.data.message || '[no message]'));
    // document.querySelectorAll('h2').forEach(h3 => {
    //   h3.textContent = event.data.message;
    // });

    const selection = window.getSelection();
    console.log('selection: ', selection);
    
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    console.log('Range guy: ', range);
    // Replace the selected text with the summary
    range.deleteContents();
    range.insertNode(document.createTextNode(event.data.message));
  }
});