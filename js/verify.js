// window.CONTRACT is now loaded from js/config.js
let blockno = "";
const web3 = new Web3(new Web3.providers.HttpProvider(window.CONTRACT.network));
const contract = new web3.eth.Contract(
  window.CONTRACT.abi,
  window.CONTRACT.address
);

window.addEventListener('load', async () => {
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
});

// Update the handleFileSelect function to reset the UI
function handleFileSelect() {
  const fileInput = document.getElementById("doc-file");
  if (fileInput.files.length > 0) {
    console.log("File selected:", fileInput.files[0].name);
    // Clear any previous hash and reset UI
    window.calculatedHash = null;
    $("#upload_file_button").show();

    // Forcefully remove ALL disabled attributes and classes to override App.js
    $("#upload_file_button").removeAttr("disabled");
    $("#upload_file_button").removeClass("disabled");
    $("#doc-file").removeAttr("disabled");

    $(".transaction-status").addClass("d-none");
    $("#note").html(`<h5 class="text-center text-info">File selected. Click Verify to check authenticity.</h5>`);
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
    console.log("Step 1: Check inputs");
    const urlHash = new URL(window.location.href).searchParams.get("hash");

    // Calculate hash automatically if not done
    if (!window.calculatedHash) {
      console.log("Calculating hash before verification...");
      const hash = await calculateHashAndWait();
      if (!hash) {
        console.error("Hash calculation returned null");
        return;
      }
    }

    const docHash = window.calculatedHash;
    console.log("Calculated hash:", docHash);

    // Check 1: URL Mismatch (Only if URL hash is present)
    if (urlHash) {
      console.log("Checking against URL hash:", urlHash);
      if (urlHash !== docHash) {
        console.warn("Hash mismatch with URL");
        $("#doc-status").html(`<h3 class="text-danger">Document Not Verified ❌</h3>`);
        $("#file-hash").html(`
                <div class="mt-2">
                    <span class="text-danger fw-bold">Hash Mismatch!</span><br>
                    <small class="text-muted">Calculated:</small> <span class="text-info">${truncateAddress(docHash)}</span><br>
                    <small class="text-muted">Expected:</small> <span class="text-warning">${truncateAddress(urlHash)}</span>
                </div>
             `);
        // Explicitly show the results area
        $(".transaction-status").removeClass("d-none").show();
        print_info(null, false);
        return;
      }
    }

    // Check 2: Blockchain
    console.log("Step 2: Querying blockchain...");

    // Re-initialize Web3 if needed
    if (!window.contract) {
      console.log("Initializing read-only contract connection...");
      try {
        // Use the RPC from config (1rpc.io)
        const web3ReadOnly = new Web3(new Web3.providers.HttpProvider(window.CONTRACT.network));
        window.contract = new web3ReadOnly.eth.Contract(window.CONTRACT.abi, window.CONTRACT.address);
      } catch (e) {
        console.error("Failed to init web3:", e);
        throw e;
      }
    }

    console.log("Calling findDocHash on contract:", window.CONTRACT.address);
    const result = await window.contract.methods.findDocHash(docHash).call();
    console.log("Blockchain Response:", result);

    const blockNumber = result[0];

    if (blockNumber == 0 || blockNumber == "0") {
      console.log("Document not found (block 0)");
      $("#doc-status").html(`<h3 class="text-danger">Document Not Found on Blockchain ❌</h3>`);
      $("#file-hash").html(`<span class="text-info">${truncateAddress(docHash)}</span>`);
      $("#note").html(`<h5 class="text-center text-danger">Document not registered.</h5>`);
      print_info(null, false);
    } else {
      console.log("Document found!");
      print_info(result, true);
      $("#note").html(`<h5 class="text-center text-success">Verified! ✅</h5>`);
    }

  } catch (error) {
    console.error("CRITICAL Verification Error:", error);
    $("#note").html(`<h5 class="text-center text-danger">Error: ${error.message}</h5>`);
    $(".transaction-status").addClass("d-none");
  } finally {
    console.log("Step 3: Cleanup");
    $("#loader").hide();
    $("#upload_file_button").removeAttr("disabled");
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
    reader.onload = function (event) {
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

    reader.onerror = function (error) {
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
    $("#upload_file_button").show(); // Ensure it is visible
    $("#upload_file_button").prop("disabled", false);

    // Default message
    $("#note").html(`<h5 class="text-center text-info">Document Hashed Successfully 😎<br>Click "Verify Document" to check against blockchain</h5>`);
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
