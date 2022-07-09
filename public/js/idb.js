let db;
const request = indexedDB.open("budget_tracker", 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore('new_budget', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  console.log("Error: " + event.target.errorCode);
};

// This function will be executed if we attempt to submit a new budget event and there's no internet connection
function saveRecord(record) {
  const transaction = db.transaction(["new_budget"], "readwrite");

  const store = transaction.objectStore("new_budget");

  store.add(record);
}

function uploadBudget() {
  const transaction = db.transaction(["new_budget"], "readwrite");

  const store = transaction.objectStore("new_budget");

  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
          const transaction = db.transaction(["new_budget"], "readwrite");
          const store = transaction.objectStore("new_budget");
          store.clear();
        });
    }
  };
}
function deletePending() {
  const transaction = db.transaction(["new_budget"], "readwrite");
  const store = transaction.objectStore("new_budget");
  store.clear();
}

window.addEventListener("online", uploadBudget);