const box = document.querySelector('#enabled');
chrome.storage.sync.get({ enabled: true }, ({ enabled }) => { box.checked = enabled; });
box.addEventListener('change', async () => {
  const enabled = box.checked;
  await chrome.storage.sync.set({ enabled });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'acs-classic-toggle', enabled });
});
