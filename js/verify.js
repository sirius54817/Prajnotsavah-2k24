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
  $("#upload_file_button").hide(); // Initially hide verify button
  
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
    $("#upload_file_button").hide();
    $(".transaction-status").addClass("d-none");
    $("#note").html(`<h5 class="text-center text-warning">Please calculate the hash of the selected file</h5>`);
  } else {
    $("#note").html(`<h5 class="text-center text-warning">Please select a file to verify</h5>`);
    $("#upload_file_button").hide();
  }
}

// Update verify_Hash to accept directly when hashes match
async function verify_Hash() {
  console.log("Starting verification process...");
  $("#loader").show();
  $("#upload_file_button").attr("disabled", true);
  
  try {
    // Get hash from URL if available
    const urlHash = new URL(window.location.href).searchParams.get("hash");
    console.log("URL hash:", urlHash);
    console.log("Calculated hash:", window.calculatedHash);
    
    // If no calculated hash, show error
    if (!window.calculatedHash) {
      $("#note").html(`<h5 class="text-center text-danger">Please upload and hash a file first!</h5>`);
      return;
    }
    
    // Compare hashes
    const hashesMatch = urlHash === window.calculatedHash;
    console.log("Hashes match:", hashesMatch);
    
    // Show verification result
    $(".transaction-status").removeClass("d-none");
    
    if (!hashesMatch) {
      // Document hash doesn't match URL hash - Show Not Verified
      $("#doc-status").html(`<h3 class="text-danger">
        Document Not Verified ❌
        <i class="text-danger fa fa-times-circle" aria-hidden="true"></i>
      </h3>`);
      $("#file-hash").html(`
        <span class="text-info"><i class="fa-solid fa-hashtag"></i></span> 
        <span class="text-danger">Hash Mismatch:</span><br>
        <span class="text-info">Calculated: </span>${truncateAddress(window.calculatedHash)}<br>
        <span class="text-info">Expected: </span>${truncateAddress(urlHash)}
      `);
      
      // Hide optional elements for unverified documents
      $("#download-document").hide();
      $("#college-name").hide();
      $("#contract-address").hide();
      $("#time-stamps").hide();
      $("#blockNumber").hide();
      
      // Show not valid image
      document.getElementById("student-document").src = "./files/notvalid.svg";
    } else {
      // Hashes match - Show Verified directly
      $("#doc-status").html(`<h3 class="text-success">
        Document Verified Successfully ✅
        <i class="text-success fa fa-check-circle" aria-hidden="true"></i>
      </h3>`);
      $("#file-hash").html(
        `<span class="text-info"><i class="fa-solid fa-hashtag"></i></span> ${truncateAddress(window.calculatedHash)}`
      );
      
      // Show success message
      $("#note").html(`<h5 class="text-center text-success">Document hash matches! Document is verified ✅</h5>`);
    }
  } catch (error) {
    console.error("Verification error:", error);
    $("#note").html(`<h5 class="text-center text-danger">Error verifying document: ${error.message}</h5>`);
    $(".transaction-status").addClass("d-none");
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
    reader.onload = function(event) {
      try {
        const fileContent = event.target.result;
        // Use soliditySha3 with type:'string' exactly like App.js
        const hash = web3.utils.soliditySha3({ type: 'string', value: fileContent });
        console.log("Generated hash using soliditySha3:", hash);
        $("#upload_file_button").attr("disabled", false);
        // Store the hash globally
        window.calculatedHash = hash;
        
        $("#note").html(`<h5 class="text-center text-info">Document Hashed Successfully 😎</h5>`);
        resolve(hash);

      } catch (error) {
        console.error("Error in hash calculation:", error);
        $("#note").html(`<h5 class="text-center text-danger">Error calculating hash: ${error.message}</h5>`);
        resolve(null);
      }
    };
    
    reader.onerror = function(error) {
      console.error("Error reading file:", error);
      $("#note").html(`<h5 class="text-center text-danger">Error reading file: ${error.message}</h5>`);
      resolve(null);
    };
    
    // Read as text, exactly like App.js
    reader.readAsText(file);
  });
}

// Update the get_Sha3 function to enable the verify button
async function get_Sha3() {
  $("#note").html(`<h5 class="text-warning">Hashing Your Document 😴...</h5>`);
  $("#loader").show();
  $("#calculate-hash-btn").attr("disabled", true);
  
  const hash = await calculateHashAndWait();
  
  $("#loader").hide();
  $("#calculate-hash-btn").attr("disabled", false);
  
  if (hash) {
    // Enable the verify button after successful hash calculation
    $("#upload_file_button").prop("disabled", false);
    console.log("Verify button enabled");
    
    const urlHash = new URL(window.location.href).searchParams.get("hash");
    if (urlHash) {
      // Check if the hashes match
      if (urlHash === window.calculatedHash) {
        $("#note").html(`<h5 class="text-center text-success">Hash matches the URL parameter! ✅<br>Click "Verify Document" to complete verification</h5>`);
      } else {
        $("#note").html(`<h5 class="text-center text-danger">Hash does NOT match the URL parameter! ❌<br>You can still click "Verify Document" to check details</h5>`);
      }
    } else {
      $("#note").html(`<h5 class="text-center text-info">Document Hashed Successfully 😎<br>Click "Verify Document" to complete verification</h5>`);
    }
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
    $("#note").html(`<h5 class="text-center text-warning">Please upload the document to verify against hash: ${truncateAddress(urlHash)}</h5>`);
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

// Add this function to debug button visibility
function checkButtonVisibility() {
  console.log("Calculate hash button display:", $("#calculate-hash-btn").css("display"));
  console.log("Verify button display:", $("#upload_file_button").css("display"));
  
  // Force show the verify button if needed
  $("#upload_file_button").show();
  console.log("Verify button display after force show:", $("#upload_file_button").css("display"));
}
