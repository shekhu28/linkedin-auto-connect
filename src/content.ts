// Keep track of intervalID to clear it when the user stops the extension
let intervalID: number;

// Listen to messages from the popup
chrome.runtime.onMessage.addListener(async (obj) => {
  if (obj.type === "CONNECT") {
    intervalID = await connectToPeople();
  }

  if (obj.type === "STOP") {
    clearInterval(intervalID);
  }
});

// Fetch the total number of connects from the storage
const fetchTotalNumberOfConnects = () => {
  return new Promise<number | undefined>((resolve) => {
    chrome.storage.sync.get("totalConnects", (obj) => {
      resolve(obj.totalConnects);
    });
  });
};

/* 
connectToPeople grabs all the 'Connect' buttons on the page and clicks them.
It uses MutationObserver to keep track of modal on the page, and clicks the 'Send' button.
It sends back a message to the popup on a successful connection, while also updating the
total number of connects in the storage. It returns the intervalID of the interval that
is used to keep track of the number of connects.
*/
const connectToPeople = async (): Promise<number> => {
  // Store all the 'Connect' buttons on the page
  const connectButtons: HTMLElement[] = [];

  /* Get all the 'Connect' buttons on the page, this also returns buttons that
  are not 'Connect', such as follow, message, etc. We filter out those buttons
  by checking if the button has an innerText of 'Connect' */
  const linkedInButtonEl = document.querySelectorAll<HTMLElement>(
    "[class='artdeco-button artdeco-button--2 artdeco-button--secondary ember-view']"
  );

  linkedInButtonEl.forEach((linkedInButton) => {
    if (linkedInButton.innerText === "Connect") {
      connectButtons.push(linkedInButton);
    }
  });

  // make a mutation observer to wait for the modal to be loaded and click the 'Send' button
  const observer = new MutationObserver(async () => {
    if (document.querySelector(".artdeco-button.ml1")) {
      const linkendInSendBtnEl = document.querySelector(
        ".artdeco-button.ml1"
      ) as HTMLElement;

      if (linkendInSendBtnEl.innerText === "Send") {
        linkendInSendBtnEl.click();
        // Update the total number of connects in the storage
        const totalConnects = await fetchTotalNumberOfConnects();
        chrome.storage.sync.set({
          totalConnects: totalConnects ? totalConnects + 1 : 1,
        });

        // Send a message to the popup to update the total number of connects
        chrome.runtime.sendMessage({
          type: "SUCCESS",
          total: totalConnects ? totalConnects + 1 : 1,
        });
      }
    }
  });

  const linkedInModalEl = document.querySelector(
    "#artdeco-modal-outlet"
  ) as HTMLElement;

  // Observe the modal on the page
  const config = {
    childList: true,
    subtree: true,
  };
  observer.observe(linkedInModalEl, config);

  // Counter variable to keep track of the number of 'Connect' buttons clicked
  let counter = 0;

  // Click the 'Connect' buttons on the page every interval
  const intervalID = setInterval(() => {
    if (connectButtons[counter]) {
      connectButtons[counter].click();
      counter++;
    } else {
      clearInterval(intervalID);
      chrome.runtime.sendMessage({
        type: "EXIT",
      });
    }
  }, 2000);

  return intervalID;
};
