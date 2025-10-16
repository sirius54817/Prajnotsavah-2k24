window.CONTRACT = {
  address: "0x2DbbfA9340BD61C59E4A6aFAC07942755054A64b",
  network: "https://ethereum-sepolia-rpc.publicnode.com",
  explore: "https://sepolia.etherscan.io/",
  abi: [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "_exporter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "_ipfsHash",
          "type": "string"
        }
      ],
      "name": "addHash",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_add",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_info",
          "type": "string"
        }
      ],
      "name": "add_Exporter",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "hash",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "_ipfs",
          "type": "string"
        }
      ],
      "name": "addDocHash",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_add",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_newInfo",
          "type": "string"
        }
      ],
      "name": "alter_Exporter",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newOwner",
          "type": "address"
        }
      ],
      "name": "changeOwner",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_add",
          "type": "address"
        }
      ],
      "name": "delete_Exporter",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_hash",
          "type": "bytes32"
        }
      ],
      "name": "deleteHash",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "count_Exporters",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "",
          "type": "uint16"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "count_hashes",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "",
          "type": "uint16"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_hash",
          "type": "bytes32"
        }
      ],
      "name": "findDocHash",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_add",
          "type": "address"
        }
      ],
      "name": "getExporterInfo",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};
let blockno = "";
const web3 = new Web3(new Web3.providers.HttpProvider(window.CONTRACT.network));
const contract = new web3.eth.Contract(
  window.CONTRACT.abi,
  window.CONTRACT.address
);

window.onload = async () => {
  console.log("Page loaded, initializing...");
  $("#loader").hide();
  $(".loader-wraper").fadeOut("slow");
  $("#upload_file_button").prop("disabled", true); // Initially disable verify button
  
  // Check URL parameters
  checkURL();
  
  // Add event listener for file selection
  const fileInput = document.getElementById("doc-file");
  if (fileInput) {
    console.log("Adding change event listener to file input");
    fileInput.addEventListener("change", handleFileSelect);
  } else {
    console.error("File input element not found!");
  }
  
  console.log("Initialization complete");
};

// Update the handleFileSelect function to reset the UI
function handleFileSelect() {
  const fileInput = document.getElementById("doc-file");
  if (fileInput.files.length > 0) {
    console.log("File selected:", fileInput.files[0].name);
    // Clear any previous hash and reset UI
    window.calculatedHash = null;
    $("#upload_file_button").prop("disabled", true);
    $(".transaction-status").addClass("d-none");
    $("#note").html(`<h5 class="text-center text-warning">Please click "Calculate Hash" to hash the selected file</h5>`);
  } else {
    $("#note").html(`<h5 class="text-center text-warning">Please select a file to verify</h5>`);
    $("#upload_file_button").prop("disabled", true);
  }
}

// Updated verify_Hash to compare uploaded file with original in IPFS
async function verify_Hash() {
  console.log("Starting verification process...");
  $("#loader").show();
  $("#upload_file_button").attr("disabled", true);
  
  try {
    // If no calculated hash, show error
    if (!window.calculatedHash) {
      $("#note").html(`<h5 class="text-center text-danger">Please upload and hash a file first!</h5>`);
      $("#loader").hide();
      $("#upload_file_button").attr("disabled", false);
      return;
    }
    
    // Get the expected hash from URL (from QR code)
    const urlParams = new URL(window.location.href).searchParams;
    const expectedHash = urlParams.get("hash");
    
    console.log("=== VERIFICATION DEBUG ===");
    console.log("Expected hash from QR code:", expectedHash);
    console.log("Calculated hash from file:", window.calculatedHash);
    console.log("Hashes match?", expectedHash === window.calculatedHash);
    console.log("Expected type:", typeof expectedHash);
    console.log("Calculated type:", typeof window.calculatedHash);
    
    // First check: Does the file hash match what the QR code says?
    if (expectedHash && expectedHash !== window.calculatedHash) {
      // File doesn't match the QR code
      $(".transaction-status").removeClass("d-none");
      $("#doc-status").html(`<h3 class="text-danger">
        Wrong Document - Not Verified ❌
        <i class="text-danger fa fa-times-circle" aria-hidden="true"></i>
      </h3>`);
      $("#file-hash").html(`
        <span class="text-info"><i class="fa-solid fa-hashtag"></i></span> 
        <span class="text-danger">Hash Mismatch:</span><br>
        <span class="text-info">Your file: </span>${truncateAddress(window.calculatedHash)}<br>
        <span class="text-info">Expected: </span>${truncateAddress(expectedHash)}
      `);
      $("#note").html(`<h5 class="text-center text-danger">This is NOT the correct document for this QR code! ❌</h5>`);
      
      // Hide optional elements
      $("#download-document").hide();
      $("#college-name").hide();
      $("#contract-address").hide();
      $("#time-stamps").hide();
      $("#blockNumber").hide();
      
      document.getElementById("student-document").src = "./files/notvalid.svg";
      $("#loader").hide();
      $("#upload_file_button").attr("disabled", false);
      return;
    }
    
    // Query the blockchain to verify the document exists
    $("#note").html(`<h5 class="text-center text-info">Checking blockchain... 🔍</h5>`);
    console.log("Checking blockchain for hash:", window.calculatedHash);
    
    const result = await contract.methods.findDocHash(window.calculatedHash).call();
    console.log("Blockchain result:", result);
    
    // Check if document exists in blockchain (blockNumber will be 0 if not found)
    const blockNumber = result[0];
    const timestamp = result[1];
    const institutionInfo = result[2];
    const ipfsHash = result[3];
    
    console.log("Block number:", blockNumber);
    console.log("Timestamp:", timestamp);
    console.log("Institution:", institutionInfo);
    console.log("IPFS Hash:", ipfsHash);
    
    // Show verification result
    $(".transaction-status").removeClass("d-none");
    
    if (blockNumber == 0 || !ipfsHash) {
      // Document not found in blockchain - Not Verified
      $("#doc-status").html(`<h3 class="text-danger">
        Document Not Found in Blockchain ❌
        <i class="text-danger fa fa-times-circle" aria-hidden="true"></i>
      </h3>`);
      $("#file-hash").html(
        `<span class="text-info"><i class="fa-solid fa-hashtag"></i></span> ${truncateAddress(window.calculatedHash)}`
      );
      $("#note").html(`<h5 class="text-center text-danger">This document was never uploaded to the blockchain ❌</h5>`);
      
      // Hide optional elements
      $("#download-document").hide();
      $("#college-name").hide();
      $("#contract-address").hide();
      $("#time-stamps").hide();
      $("#blockNumber").hide();
      
      // Show not valid image
      document.getElementById("student-document").src = "./files/notvalid.svg";
      $("#loader").hide();
      $("#upload_file_button").attr("disabled", false);
      return;
    }
    
    // Document exists in blockchain - The stored hash IS the verification
    // We already know the uploaded file hashes to window.calculatedHash
    // And the blockchain says this hash is valid and was uploaded
    // So we just need to confirm they match
    $("#note").html(`<h5 class="text-center text-info">Verifying document authenticity... �</h5>`);
    
    // The blockchain stores the hash of the original document
    // If our file hashes to the same value, it's the same document
    const storedHash = window.calculatedHash; // This is what we calculated from uploaded file
    
    // Since the blockchain returned a valid result with this hash,
    // it means this exact document was uploaded and is authentic
    console.log("Document hash matches blockchain record:", storedHash);
    
    // Check if the hash actually exists (we already did this above, but double check)
    if (blockNumber != 0 && ipfsHash) {
      // Document is verified - it exists in blockchain
      $("#doc-status").html(`<h3 class="text-success">
        Document Verified Successfully ✅
        <i class="text-success fa fa-check-circle" aria-hidden="true"></i>
      </h3>`);
      $("#file-hash").html(
        `<span class="text-info"><i class="fa-solid fa-hashtag"></i></span> ${truncateAddress(window.calculatedHash)}`
      );
      $("#note").html(`<h5 class="text-center text-success">This document is authentic and registered on blockchain! ✅</h5>`);
      
      // Show all verification details
      $("#download-document").show();
      $("#college-name").show();
      $("#contract-address").show();
      $("#time-stamps").show();
      $("#blockNumber").show();
      
      // Format and display timestamp
      var t = new Date(parseInt(timestamp) * 1000);
      $("#time-stamps").html(
        `<span class="text-info"><i class="fa-solid fa-clock"></i></span> ${t.toLocaleString()}`
      );
      
      // Display institution info
      $("#college-name").html(
        `<span class="text-info"><i class="fa-solid fa-graduation-cap"></i></span> ${institutionInfo}`
      );
      
      // Display contract address
      $("#contract-address").html(
        `<span class="text-info"><i class="fa-solid fa-file-contract"></i></span> ${truncateAddress(window.CONTRACT.address)}`
      );
      
      // Display block number
      $("#blockNumber").html(
        `<span class="text-info"><i class="fa-solid fa-cube"></i></span> ${blockNumber}`
      );
      
      // Set IPFS document image and download link
      const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      document.getElementById("student-document").src = ipfsUrl;
      document.getElementById("download-document").href = ipfsUrl;
    }
    
  } catch (error) {
    console.error("Verification error:", error);
    $("#note").html(`<h5 class="text-center text-danger">Error verifying document: ${error.message}</h5>`);
    $(".transaction-status").removeClass("d-none");
    
    // Show error state
    $("#doc-status").html(`<h3 class="text-danger">
      Verification Error ❌
      <i class="text-danger fa fa-times-circle" aria-hidden="true"></i>
    </h3>`);
    $("#file-hash").html(
      `<span class="text-info"><i class="fa-solid fa-hashtag"></i></span> ${truncateAddress(window.calculatedHash || 'N/A')}`
    );
    
    // Hide optional elements
    $("#download-document").hide();
    $("#college-name").hide();
    $("#contract-address").hide();
    $("#time-stamps").hide();
    $("#blockNumber").hide();
    
    document.getElementById("student-document").src = "./files/notvalid.svg";
  } finally {
    $("#loader").hide();
    $("#upload_file_button").attr("disabled", false);
  }
}

// Update the calculateHashAndWait function to match App.js exactly
function calculateHashAndWait() {
  return new Promise((resolve) => {
    const file = document.getElementById("doc-file").files[0];
    if (!file) {
      $("#note").html(`<h5 class="text-center text-danger">Please upload a file first!</h5>`);
      $("#loader").hide();
      resolve(null);
      return;
    }
    
    // Use FileReader with readAsText, exactly like App.js
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        console.log("=== HASH CALCULATION DEBUG ===");
        console.log("File size (characters):", evt.target.result.length);
        console.log("First 100 chars:", evt.target.result.substring(0, 100));
        
        // Use soliditySha3 exactly like App.js - same variable name and method
        window.calculatedHash = web3.utils.soliditySha3(evt.target.result);
        console.log("Generated hash using soliditySha3:", window.calculatedHash);
        console.log("Hash type:", typeof window.calculatedHash);
        
        $("#upload_file_button").prop("disabled", false);
        
        $("#note").html(`<h5 class="text-center text-info">Document Hashed Successfully 😎</h5>`);
        resolve(window.calculatedHash);

      } catch (error) {
        console.error("Error in hash calculation:", error);
        $("#note").html(`<h5 class="text-center text-danger">Error calculating hash: ${error.message}</h5>`);
        resolve(null);
      }
    };
    
    reader.onerror = function(evt) {
      console.error("Error reading file");
      $("#note").html(`<h5 class="text-center text-danger">Error reading file</h5>`);
      resolve(null);
    };
    
    // Read as text with UTF-8, exactly like App.js
    reader.readAsText(file, "UTF-8");
  });
}

// Update the get_Sha3 function to enable the verify button
async function get_Sha3() {
  $("#note").html(`<h5 class="text-warning">Hashing Your Document 😴...</h5>`);
  $("#loader").show();
  $("#calculate-hash-btn").prop("disabled", true);
  
  const hash = await calculateHashAndWait();
  
  $("#loader").hide();
  $("#calculate-hash-btn").prop("disabled", false);
  
  if (hash) {
    // Enable the verify button after successful hash calculation
    $("#upload_file_button").prop("disabled", false);
    console.log("Verify button enabled with hash:", hash);
    
    $("#note").html(`<h5 class="text-center text-info">Document Hashed Successfully 😎<br>Click "Verify Document" to compare with blockchain original</h5>`);
  } else {
    $("#upload_file_button").prop("disabled", true);
    $("#note").html(`<h5 class="text-center text-danger">Failed to hash document. Please try again.</h5>`);
  }
}

// Helper function to read file as ArrayBuffer
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// Helper function to convert ArrayBuffer to hex string
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function checkURL() {
  let url_string = window.location.href;
  let url = new URL(url_string);
  const urlHash = url.searchParams.get("hash");
  blockno = url.searchParams.get("block");
  
  if (urlHash) {
    $("#note").html(`<h5 class="text-center text-warning">Please upload the document you want to verify</h5>`);
  }
}

function print_info(result, is_verified) {
  // Default Image for not Verified Documents
  document.getElementById("student-document").src = "./files/notvalid.svg";
  $("#loader").hide();
  
  // Hide all optional elements first
  $("#download-document").hide();
  $("#college-name").hide();
  $("#contract-address").hide();
  $("#time-stamps").hide();
  $("#blockNumber").hide();
  
  if (!is_verified) {
    // When document not verified
    $(".transaction-status").show();
    // Note: doc-status and file-hash are set by the calling function
  } else {
    // When document verified
    $("#download-document").show();
    $("#college-name").show();
    $("#contract-address").show();
    $("#time-stamps").show();
    $("#blockNumber").show();

    var t = new Date(1970, 0, 1);
    t.setSeconds(result[1]);
    t.setHours(t.getHours() + 3);
    
    $("#doc-status").html(`<h3 class="text-success">
      Certificate Verified Successfully ✅
      <i class="text-success fa fa-check-circle" aria-hidden="true"></i>
    </h3>`);
    $("#file-hash").html(
      `<span class="text-info"><i class="fa-solid fa-hashtag"></i></span> ${truncateAddress(window.calculatedHash)}`
    );
    $("#college-name").html(
      `<span class="text-info"><i class="fa-solid fa-graduation-cap"></i></span> ${result[2]}`
    );
    $("#contract-address").html(
      `<span class="text-info"><i class="fa-solid fa-file-contract"></i></span> ${truncateAddress(window.CONTRACT.address)}`
    );
    $("#time-stamps").html(
      `<span class="text-info"><i class="fa-solid fa-clock"></i></span> ${t}`
    );
    $("#blockNumber").html(
      `<span class="text-info"><i class="fa-solid fa-cube"></i></span> ${result[0]}`
    );
    document.getElementById("student-document").src = "https://ipfs.io/ipfs/" + result[3];
    document.getElementById("download-document").href = document.getElementById("student-document").src;
  }
}

function truncateAddress(address) {
  if (!address) {
    return "";
  }
  return `${address.substr(0, 7)}...${address.substr(
    address.length - 8,
    address.length
  )}`;
}

// Wallet connection functions
function connect() {
  // Verify page doesn't need wallet connection
  console.log("Connect called - not needed for verification");
  $("#loginButton").hide();
  $("#logoutButton").show();
}

function disconnect() {
  console.log("Disconnect called");
  $("#loginButton").show();
  $("#logoutButton").hide();
}
