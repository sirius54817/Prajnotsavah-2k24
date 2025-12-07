// window.CONTRACT is now loaded from js/config.js

let blockNumber = "";

async function connect() {
  if (window.ethereum) {
    try {
      const selectedAccount = await window.ethereum
        .request({
          method: "eth_requestAccounts",
        })
        .then((accounts) => {
          return accounts[0];
        })
        .catch(() => {
          throw Error("No account selected 👍");
        });

      window.userAddress = selectedAccount;
      console.log(selectedAccount);
      window.localStorage.setItem("userAddress", window.userAddress);
      window.location.reload();
    } catch (error) { }
  } else {
    $("#upload_file_button").attr("disabled", true);
    $("#doc-file").attr("disabled", true);
    // Show The Warning for not detecting wallet
    document.querySelector(".alert").classList.remove("d-none");
  }
}

window.addEventListener('load', async () => {
  $("#loader").hide();

  $("#loginButton").hide();
  $("#recent-header").hide();
  $(".loader-wraper").fadeOut("slow");
  hide_txInfo();
  $("#upload_file_button").attr("disabled", true);
  // Check for network mismatch immediately on load
  if (window.ethereum) {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (parseInt(chainId, 16) !== window.CONTRACT.chainId) {
      await switchNetwork();
    }
  }
  window.userAddress = window.localStorage.getItem("userAddress");

  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    window.contract = new window.web3.eth.Contract(
      window.CONTRACT.abi,
      window.CONTRACT.address
    );
    if (window.userAddress && window.userAddress !== "null" && window.userAddress.length > 10) {
      // let isLocked =await window.ethereum._metamask.isUnlocked();
      //  if(!isLocked) disconnect();
      $("#logoutButton").show();
      $("#loginButton").hide();
      $("#userAddress")
        .html(`<i class="fa-solid fa-address-card mx-2 text-primary"></i>${truncateAddress(
          window.userAddress
        )}
       <a class="text-info" href="${window.CONTRACT.explore}/address/${window.userAddress
          }" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-square-arrow-up-right text-warning"></i></a>  
       </a>`);

      if (window.location.pathname == "/admin.html") await getCounters();

      await getExporterInfo();
      await get_ChainID();
      await get_ethBalance();
      $("#Exporter-info").html(
        `<i class="fa-solid fa-building-columns mx-2 text-warning"></i>${window.info}`
      );

      setTimeout(() => {
        listen();
      }, 0);
    } else {
      $("#logoutButton").hide();
      $("#loginButton").show();
      $("#upload_file_button").attr("disabled", true);
      $("#doc-file").attr("disabled", true);
      $(".box").addClass("d-none");
      $(".loading-tx").addClass("d-none");
    }
  } else {
    //No metamask detected
    $("#logoutButton").hide();
    $("#loginButton").hide();
    $(".box").addClass("d-none");
    $("#upload_file_button").attr("disabled", true);
    $("#doc-file").attr("disabled", true);
    document.querySelector(".alert").classList.remove("d-none");

    // alert("Please download metamask extension first.\nhttps://metamask.io/download/");
    // window.location = "https://metamask.io/download/"
  }

  // Add this line to check exporter status on page load
  const status = await checkExporterStatus();
  console.log("Authorization status:", status);

  if (status && !status.isExporter && !status.isOwner) {
    $("#note").html(`<h5 class="text-danger">Your wallet (${truncateAddress(status.address)}) is not authorized as an exporter</h5>`);
    $("#upload_file_button").attr("disabled", true);
  }
});

function hide_txInfo() {
  $(".transaction-status").addClass("d-none");
}

function show_txInfo() {
  $(".transaction-status").removeClass("d-none");
}
async function get_ethBalance() {
  await web3.eth.getBalance(window.userAddress, function (err, balance) {
    if (err === null) {
      $("#userBalance").html(
        "<i class='fa-brands fa-gg-circle mx-2 text-danger'></i>" +
        web3.utils.fromWei(balance).substr(0, 6) +
        ""
      );
    } else $("#userBalance").html("n/a");
  });
}

if (window.ethereum) {
  window.ethereum.on("accountsChanged", function (accounts) {
    connect();
  });
}

function printUploadInfo(result) {
  $("#transaction-hash").html(
    `<a target="_blank" title="View Transaction at Polygon Scan" href="${window.CONTRACT.explore}/tx/` +
    result.transactionHash +
    '"+><i class="fa fa-check-circle font-size-2 mx-1 text-white mx-1"></i></a>' +
    truncateAddress(result.transactionHash)
  );
  $("#file-hash").html(
    `<i class="fa-solid fa-hashtag mx-1"></i> ${truncateAddress(
      window.hashedfile
    )}`
  );
  $("#contract-address").html(
    `<i class="fa-solid fa-file-contract mx-1"></i> ${truncateAddress(
      result.to
    )}`
  );
  $("#time-stamps").html('<i class="fa-solid fa-clock mx-1"></i>' + getTime());
  $("#blockNumber").html(
    `<i class="fa-solid fa-link mx-1"></i>${result.blockNumber}`
  );
  blockNumber = result.blockNumber;
  $("#blockHash").html(
    `<i class="fa-solid fa-shield mx-1"></i> ${truncateAddress(
      result.blockHash
    )}`
  );
  $("#to-netowrk").html(
    `<i class="fa-solid fa-chart-network"></i> ${window.chainID}`
  );
  $("#to-netowrk").hide();
  $("#gas-used").html(
    `<i class="fa-solid fa-gas-pump mx-1"></i> ${result.gasUsed} Gwei`
  );
  $("#loader").addClass("d-none");
  $("#upload_file_button").addClass("d-block");
  show_txInfo();
  get_ethBalance();

  $("#note").html(`<h5 class="text-info">
   Transaction Confirmed to the BlockChain 😊<i class="mx-2 text-info fa fa-check-circle" aria-hidden="true"></i>
   </h5>`);
  listen();
}

async function sendHash(fileHash, ipfsCid) {
  try {
    // First check if user is authorized
    const status = await checkExporterStatus();

    // The contract modifier canAddHash REQURIES the caller to be in the Exporters mapping.
    // Being 'owner' is not enough; the owner must explicitly add themselves as an exporter.
    if (!status.isExporter) {
      if (status.isOwner) {
        throw new Error("Owner must add themselves as an Exporter first (Go to Admin -> Add Exporter)");
      }
      throw new Error("Your wallet is not authorized as an exporter");
    }

    $("#loader").removeClass("d-none");
    $("#upload_file_button").slideUp();
    $("#note").html(`<h5 class="text-info">Please confirm the transaction 🙂</h5>`);

    // Log the parameters being sent to the contract
    console.log("Sending hash to contract:", {
      contractAddress: window.CONTRACT.address,
      fileHash: window.hashedfile,
      ipfsCid: ipfsCid,
      fromAddress: window.userAddress
    });

    const result = await window.contract.methods
      .addDocHash(window.hashedfile, ipfsCid)
      .send({ from: window.userAddress })
      .on("transactionHash", function (hash) {
        console.log("Transaction hash:", hash);
        $("#note").html(`<h5 class="text-info p-1 text-center">Please wait for transaction to be mined 😴</h5>`);
      })
      .on("receipt", function (receipt) {
        console.log("Transaction receipt:", receipt);
        printUploadInfo(receipt);
        generateQRCode();
      })
      .on("error", function (error) {
        console.error("Transaction error:", error);
        $("#note").html(`<h5 class="text-danger">Transaction error: ${error.message}</h5>`);
        $("#loader").addClass("d-none");
        $("#upload_file_button").slideDown();
      });

    return result;
  } catch (error) {
    console.error('Error in sendHash:', error);
    $("#note").html(`<h5 class="text-danger">Transaction failed: ${error.message}</h5>`);
    $("#loader").addClass("d-none");
    $("#upload_file_button").slideDown();
    throw error;
  }
}

async function deleteHash() {
  $("#loader").removeClass("d-none");
  $("#upload_file_button").slideUp();
  $("#note").html(
    `<h5 class="text-info">Please confirm the transaction 🙂</h5>`
  );
  $("#upload_file_button").attr("disabled", true);
  await get_ChainID();

  if (window.hashedfile) {
    await window.contract.methods
      .deleteHash(window.hashedfile)
      .send({ from: window.userAddress })
      .on("transactionHash", function (hash) {
        $("#note").html(
          `<h5 class="text-info p-1 text-center">Please wait for transaction to be mined 😴</h5>`
        );
      })

      .on("receipt", function (receipt) {
        $("#note").html(
          `<h5 class="text-info p-1 text-center">Document Deleted 😳</h5>`
        );

        $("#loader").addClass("d-none");
        $("#upload_file_button").slideDown();
      })

      .on("confirmation", function (confirmationNr) {
        console.log(confirmationNr);
      })
      .on("error", function (error) {
        console.log(error.message);
        $("#note").html(
          `<h5 class="text-center">Certificate is not found.</h5>`
        );
        $("#loader").addClass("d-none");
        $("#upload_file_button").slideDown();
      });
  }
}

function getTime() {
  let d = new Date();
  a =
    d.getFullYear() +
    "-" +
    (d.getMonth() + 1) +
    "-" +
    d.getDate() +
    " - " +
    d.getHours() +
    ":" +
    d.getMinutes() +
    ":" +
    d.getSeconds();
  return a;
}

async function get_ChainID() {
  // Return early if no ethereum object
  if (!window.ethereum) return;

  let chainId = await window.ethereum.request({ method: 'eth_chainId' });
  let decimalChainId = parseInt(chainId, 16);
  console.log("Current Chain ID:", decimalChainId);

  switch (decimalChainId) {
    case 1:
      window.chainID = "Ethereum Main Network (Mainnet)";
      break;
    case 11155111:
      window.chainID = "Sepolia Test Network";
      break;
    case 80001:
      window.chainID = "Polygon Test Network";
      break;
    case 137:
      window.chainID = "Polygon Mainnet";
      break;
    case 1337:
      window.chainID = "Localhost 8545";
      break;
    default:
      window.chainID = "Unknown ChainID (" + decimalChainId + ")";
      break;
  }

  let network = document.getElementById("network");
  if (network) {
    document.getElementById(
      "network"
    ).innerHTML = `<i class="text-info fa-solid fa-circle-nodes mx-2"></i>${window.chainID}`;
  }

  // Auto-switch if wrong network
  if (decimalChainId !== window.CONTRACT.chainId) {
    console.warn(`Wrong network. Expected ${window.CONTRACT.chainId}, got ${decimalChainId}`);
    // Optional: could trigger switchNetwork() here automatically or show a UI warning
  }
}

async function switchNetwork() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + window.CONTRACT.chainId.toString(16) }],
    });
    window.location.reload();
  } catch (error) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (error.code === 4902) {
      alert("Please add Sepolia network to MetaMask");
    } else {
      console.error("Failed to switch network:", error);
    }
  }
}

function get_Sha3() {
  hide_txInfo();
  $("#note").html(`<h5 class="text-warning">Hashing Your Document 😴...</h5>`);

  $("#upload_file_button").attr("disabled", false);

  console.log("file changed");

  var file = document.getElementById("doc-file").files[0];
  if (file) {
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function (evt) {
      // var SHA256 = new Hashes.SHA256();
      // = SHA256.hex(evt.target.result);
      window.hashedfile = web3.utils.soliditySha3(evt.target.result);
      var hashf = window.hashedfile;
      console.log(`Document Hash : ${window.hashedfile}`);
      $("#note").html(
        `<h5 class="text-center text-info">Document Hashed  😎 </h5>`
      );
      return hashf;
    };
    reader.onerror = function (evt) {
      console.log("error reading file");
    };
  } else {
    window.hashedfile = null;
  }

}

function disconnect() {
  $("#logoutButton").hide();
  $("#loginButton").show();
  window.userAddress = null;
  $(".wallet-status").addClass("d-none");
  window.localStorage.removeItem("userAddress");
  $("#upload_file_button").addClass("disabled");
}

function truncateAddress(address) {
  if (!address) {
    return;
  }
  return `${address.substr(0, 7)}...${address.substr(
    address.length - 8,
    address.length
  )}`;
}

async function addExporter() {
  const address = document.getElementById("Exporter-address").value;
  const info = document.getElementById("info").value;

  if (info && address) {
    $("#loader").removeClass("d-none");
    $("#ExporterBtn").slideUp();
    $("#edit").slideUp();
    $("#delete").slideUp();
    $("#note").html(
      `<h5 class="text-info">Please confirm the transaction 👍...</h5>`
    );
    $("#ExporterBtn").attr("disabled", true);
    $("#delete").attr("disabled", true);
    $("#edit").attr("disabled", true);
    await get_ChainID();

    try {
      await window.contract.methods
        .add_Exporter(address, info)
        .send({ from: window.userAddress })

        .on("transactionHash", function (hash) {
          $("#note").html(
            `<h5 class="text-info p-1 text-center">Please wait for transaction to be mined 😴...</h5>`
          );
        })

        .on("receipt", function (receipt) {
          $("#loader").addClass("d-none");
          $("#ExporterBtn").slideDown();
          $("#edit").slideDown();
          $("#delete").slideDown();
          console.log(receipt);
          $("#note").html(
            `<h5 class="text-info">Exporter Added to the Blockchain 😇</h5>`
          );
        })

        .on("confirmation", function (confirmationNr) { })
        .on("error", function (error) {
          console.log(error.message);
          $("#note").html(
            `<h5 class="text-center">University is not able to add beacuse already present in block chain.</h5>`
          );
          $("#loader").addClass("d-none");
          $("#ExporterBtn").slideDown();
        });
    } catch (error) {
      $("#note").html(`<h5 class="text-center">${error.message}</h5>`);
      $("#loader").addClass("d-none");
      $("#ExporterBtn").slideDown();
      $("#edit").slideDown();
      $("#delete").slideDown();
    }
  } else {
    $("#note").html(
      `<h5 class="text-center text-warning">You need to provide address & inforamtion to add  </h5>`
    );
  }
}

async function getExporterInfo() {
  await window.contract.methods
    .getExporterInfo(window.userAddress)
    .call({ from: window.userAddress })

    .then((result) => {
      window.info = result;
    });
}

async function getCounters() {
  await window.contract.methods
    .count_Exporters()
    .call({ from: window.userAddress })

    .then((result) => {
      $("#num-exporters").html(
        `<i class="fa-solid fa-building-columns mx-2 text-info"></i>${result}`
      );
    });
  await window.contract.methods
    .count_hashes()
    .call({ from: window.userAddress })

    .then((result) => {
      $("#num-hashes").html(
        `<i class="fa-solid fa-file mx-2 text-warning"></i>${result}`
      );
    });
}

async function editExporter() {
  const address = document.getElementById("Exporter-address").value;
  const info = document.getElementById("info").value;

  if (info && address) {
    $("#loader").removeClass("d-none");
    $("#ExporterBtn").slideUp();
    $("#edit").slideUp();
    $("#delete").slideUp();
    $("#note").html(
      `<h5 class="text-info">Please confirm the transaction 😴...</h5>`
    );
    $("#ExporterBtn").attr("disabled", true);
    await get_ChainID();

    try {
      await window.contract.methods
        .alter_Exporter(address, info)
        .send({ from: window.userAddress })

        .on("transactionHash", function (hash) {
          $("#note").html(
            `<h5 class="text-info p-1 text-center">Please wait for transaction to be mined 😇...</h5>`
          );
        })

        .on("receipt", function (receipt) {
          $("#loader").addClass("d-none");
          $("#ExporterBtn").slideDown();
          console.log(receipt);
          $("#note").html(
            `<h5 class="text-info">Exporter Updated Successfully 😊</h5>`
          );
        })

        .on("confirmation", function (confirmationNr) { })
        .on("error", function (error) {
          console.log(error.message);
          $("#note").html(`<h5 class="text-center">${error.message} 👍</h5>`);
          $("#loader").addClass("d-none");
          $("#ExporterBtn").slideDown();
        });
    } catch (error) {
      $("#note").html(`<h5 class="text-center">${error.message} 👍</h5>`);
      $("#loader").addClass("d-none");
      $("#ExporterBtn").slideDown();
      $("#edit").slideDown();
      $("#delete").slideDown();
    }
  } else {
    $("#note").html(
      `<h5 class="text-center text-warning">You need to provide address & inforamtion to update 😵‍💫 </h5>`
    );
  }
}

async function deleteExporter() {
  const address = document.getElementById("Exporter-address").value;

  if (address) {
    $("#loader").removeClass("d-none");
    $("#ExporterBtn").slideUp();
    $("#edit").slideUp();
    $("#delete").slideUp();
    $("#note").html(
      `<h5 class="text-info">Please confirm the transaction 😕...</h5>`
    );
    $("#ExporterBtn").attr("disabled", true);
    await get_ChainID();

    try {
      await window.contract.methods
        .delete_Exporter(address)
        .send({ from: window.userAddress })

        .on("transactionHash", function (hash) {
          $("#note").html(
            `<h5 class="text-info p-1 text-center">Please wait for transaction to be mined 😴 ...</h5>`
          );
        })

        .on("receipt", function (receipt) {
          $("#loader").addClass("d-none");
          $("#ExporterBtn").slideDown();
          $("#edit").slideDown();
          $("#delete").slideDown();
          console.log(receipt);
          $("#note").html(
            `<h5 class="text-info">Exporter Deleted Successfully 🙂</h5>`
          );
        })
        .on("error", function (error) {
          console.log(error.message);
          $("#note").html(`<h5 class="text-center">${error.message} 🙂</h5>`);
          $("#loader").addClass("d-none");
          $("#ExporterBtn").slideDown();
          $("#edit").slideDown();
          $("#delete").slideDown();
        });
    } catch (error) {
      $("#note").html(`<h5 class="text-center">${error.message} 🙂</h5>`);
      $("#loader").addClass("d-none");
      $("#ExporterBtn").slideDown();
      $("#edit").slideDown();
      $("#delete").slideDown();
    }
  } else {
    $("#note").html(
      `<h5 class="text-center text-warning">You need to provide address to delete 👍</h5>`
    );
  }
}

function generateQRCode() {
  document.getElementById("qrcode").innerHTML = "";
  console.log("making qr-code...");
  var qrcode = new QRCode(document.getElementById("qrcode"), {
    colorDark: "#000",
    colorLight: "#fff",
    correctLevel: QRCode.CorrectLevel.H,
  });
  if (!window.hashedfile) return;
  let url = `${window.location.host}/verify.html?hash=${window.hashedfile}&block=${blockNumber}`;
  qrcode.makeCode(url);
  document.getElementById("download-link").download =
    document.getElementById("doc-file").files[0].name;
  document.getElementById("verfiy").href =
    window.location.protocol + "//" + url;

  function makeDownload() {
    document.getElementById("download-link").href =
      document.querySelector("#qrcode img").src;
  }
  setTimeout(makeDownload, 500);
  //  makeDownload();
}

async function listen() {
  console.log("started...");
  if (window.location.pathname != "/upload.html") return;
  document.querySelector(".loading-tx").classList.remove("d-none");
  window.web3 = new Web3(window.ethereum);
  window.contract = new window.web3.eth.Contract(
    window.CONTRACT.abi,
    window.CONTRACT.address
  );
  await window.contract.getPastEvents(
    "addHash",
    {
      filter: {
        _exporter: window.userAddress, //Only get the documents uploaded by current Exporter
      },
      fromBlock: (await window.web3.eth.getBlockNumber()) - 999,
      toBlock: "latest",
    },
    function (error, events) {
      printTransactions(events);
      console.log(events[0].blockNumber);
      blockNumber = events[0].blockNumber;
    }
  );
}

function printTransactions(data) {
  document.querySelector(".transactions").innerHTML = "";
  document.querySelector(".loading-tx").classList.add("d-none");
  if (!data.length) {
    $("#recent-header").hide();
    return;
  }
  $("#recent-header").show();
  const main = document.querySelector(".transactions");
  for (let i = 0; i < data.length; i++) {
    const a = document.createElement("a");
    a.href = `${window.CONTRACT.explore}` + "/tx/" + data[i].transactionHash;
    a.setAttribute("target", "_blank");
    a.className =
      "col-lg-3 col-md-4 col-sm-5 m-2  bg-dark text-light rounded position-relative card";
    a.style = "overflow:hidden;";
    const image = document.createElement("object");
    image.style = "width:100%;height: 100%;";
    image.data = `https://ipfs.io/ipfs/${data[i].returnValues[1]}`;
    const num = document.createElement("h1");
    num.append(document.createTextNode(i + 1));
    a.appendChild(image);
    num.style =
      "position:absolute; left:4px; bottom: -20px;font-size:4rem; color: rgba(20, 63, 74, 0.35);";
    a.appendChild(num);
    main.prepend(a);
  }
}

async function checkExporterStatus() {
  try {
    // Get current user address
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const userAddress = accounts[0];
    console.log("Current user address:", userAddress);

    // Initialize contract with the CORRECT address
    const web3 = new Web3(window.ethereum);
    const contractAddress = "0x363B926DFc8c7E0ee7DBd3bf41325B314Ba0Ba81"; // Use the address from the error
    const contract = new web3.eth.Contract(window.CONTRACT.abi, contractAddress);

    // Check if user is an exporter
    const exporterInfo = await contract.methods.getExporterInfo(userAddress).call();
    console.log("Exporter info:", exporterInfo);

    // Check if user is the owner
    const owner = await contract.methods.owner().call();
    console.log("Contract owner:", owner);
    console.log("Is user the owner:", owner.toLowerCase() === userAddress.toLowerCase());

    return {
      address: userAddress,
      isExporter: exporterInfo && exporterInfo.length > 0,
      isOwner: owner.toLowerCase() === userAddress.toLowerCase(),
      exporterInfo: exporterInfo
    };
  } catch (error) {
    console.error("Error checking exporter status:", error);
    return { error: error.message };
  }
}

async function checkIfHashExists(hash) {
  try {
    const result = await window.contract.methods.findDocHash(hash).call();
    // If blockNumber is not 0, the hash exists
    return result[0] != 0;
  } catch (error) {
    console.error("Error checking hash existence:", error);
    return false;
  }
}

async function uploadToIPFSAndBlockchain() {
  try {
    if (!window.hashedfile) {
      $("#note").html(`<h5 class="text-danger">Please select a file first</h5>`);
      return;
    }

    // Check if hash already exists
    const hashExists = await checkIfHashExists(window.hashedfile);
    if (hashExists) {
      $("#note").html(`<h5 class="text-danger">This document has already been registered</h5>`);
      return;
    }

    // Continue with IPFS upload and blockchain transaction
    // ... existing code ...
  } catch (error) {
    console.error("Upload error:", error);
    $("#note").html(`<h5 class="text-danger">Upload failed: ${error.message}</h5>`);
  }
}

function ensureContractInitialized() {
  if (!window.contract) {
    window.web3 = new Web3(window.ethereum);
    window.contract = new window.web3.eth.Contract(
      window.CONTRACT.abi,
      "0x363B926DFc8c7E0ee7DBd3bf41325B314Ba0Ba81" // Use the correct address
    );
    console.log("Contract initialized with address:", window.contract._address);
  }
  return window.contract;
}
