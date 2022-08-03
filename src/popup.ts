const getActiveTabURL = async (): Promise<chrome.tabs.Tab> => {
  const tabs = await chrome.tabs.query({
    currentWindow: true,
    active: true,
  });

  return tabs[0];
};

// Selecting and declaring all the elements on the page
const popupConnectBtnEl = document.querySelector(".connect-btn") as HTMLElement;
const popupStopConnectBtnEl = document.querySelector(
  ".connect-btn-stop"
) as HTMLElement;
const totalConnectsEl = document.querySelector(
  ".total-connect-number"
) as HTMLElement;
const progressBarEl = document.querySelector(
  ".connect-progress"
) as HTMLElement;

// Add a click listener to the "start connecting" button, which will send a message to the content script to start the connection
popupConnectBtnEl.addEventListener("click", async () => {
  const { id } = await getActiveTabURL();

  chrome.tabs.sendMessage(id!, {
    type: "CONNECT",
  });
  popupConnectBtnEl.style.display = "none";
  popupStopConnectBtnEl.style.display = "block";
});

// Add a click listener to the "stop connecting" button, which will send a message to the content script to stop the connection
popupStopConnectBtnEl.addEventListener("click", async () => {
  const { id } = await getActiveTabURL();

  chrome.tabs.sendMessage(id!, {
    type: "STOP",
  });
  popupConnectBtnEl.style.display = "block";
  popupStopConnectBtnEl.style.display = "none";
});

chrome.runtime.onMessage.addListener(async (obj) => {
  if (obj.type === "SUCCESS") {
    totalConnectsEl.innerText = obj.total.toString();
    progressBarEl.setAttribute("value", obj.total.toString());
  }

  if (obj.type === "EXIT") {
    popupConnectBtnEl.style.display = "block";
    popupStopConnectBtnEl.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  chrome.storage.sync.get("totalConnects", (obj) => {
    if (obj.totalConnects) {
      totalConnectsEl.innerText = obj.totalConnects.toString();
      progressBarEl.setAttribute("value", obj.totalConnects.toString());
    }
  });
});
