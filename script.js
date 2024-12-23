let vehicles = [];
let currentDatabase = 'bikes';

// Function to switch between databases
function switchDatabase(database) {
  currentDatabase = database;
  
  // Update UI for active button
  document.querySelectorAll('.db-button').forEach(button => {
    button.classList.remove('active');
  });
  document.getElementById(`${database}-db`).classList.add('active');
  
  // Clear current selections
  document.getElementById('make').value = '';
  document.getElementById('model').value = '';
  document.getElementById('price-sort').value = '';
  document.getElementById('year-sort').value = '';
  
  // Fetch new data
  loadDatabaseData(database);
}

// Function to load database data
function loadDatabaseData(database) {
  const dataFile = database === 'bikes' ? 'motorcycles.json' : 'cars.json';
  
  fetch(dataFile)
    .then(response => response.json())
    .then(data => {
      vehicles = data;
      populateMakes();
      // Clear the vehicle list instead of filtering when data is loaded
      document.getElementById("vehicle-list").innerHTML = '';
    })
    .catch(error => {
      console.error(`Error loading ${database} data:`, error);
    });
}

// Populate Make dropdown
function populateMakes() {
  const makeSelect = document.getElementById("make");
  makeSelect.innerHTML = '<option value="">--Select Make--</option>';

  // Get unique Makes and sort them alphabetically
  const makes = [...new Set(vehicles.map(vehicle => vehicle.Manufacturer))].sort();

  makes.forEach(make => {
    const option = document.createElement("option");
    option.value = make;
    option.textContent = make;
    makeSelect.appendChild(option);
  });
}

// Update Model options based on selected Make
function updateModelOptions() {
  const makeSelect = document.getElementById("make");
  const modelSelect = document.getElementById("model");
  const selectedMake = makeSelect.value;

  // Clear the current Model options
  modelSelect.innerHTML = '<option value="">--Select Model--</option>';

  // Only populate models if a make is selected
  if (selectedMake) {
    // Filter vehicles based on selected Make and get unique Models, then sort them
    const models = [...new Set(vehicles
      .filter(vehicle => vehicle.Manufacturer === selectedMake)
      .map(vehicle => vehicle.Model))].sort();

    models.forEach(model => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      modelSelect.appendChild(option);
    });
  }

  // Filter results based on selected Make
  filterVehicles();
}

// Filter vehicles based on selected Make, Model, and sort options
function filterVehicles() {
  const makeSelect = document.getElementById("make");
  const modelSelect = document.getElementById("model");
  const priceSortSelect = document.getElementById("price-sort");
  const yearSortSelect = document.getElementById("year-sort");
  const selectedMake = makeSelect.value;
  const selectedModel = modelSelect.value;
  const selectedPriceSort = priceSortSelect.value;
  const selectedYearSort = yearSortSelect.value;

  // If no make is selected, clear the display and return
  if (!selectedMake) {
    document.getElementById("vehicle-list").innerHTML = '';
    return;
  }

  // Filter vehicles based on selected Make and Model
  const filteredVehicles = vehicles.filter(vehicle => {
    return (vehicle.Manufacturer === selectedMake) &&
           (!selectedModel || vehicle.Model === selectedModel);
  });

  // Sort by Price
  if (selectedPriceSort === 'low-high') {
    filteredVehicles.sort((a, b) => a.Price - b.Price);
  } else if (selectedPriceSort === 'high-low') {
    filteredVehicles.sort((a, b) => b.Price - a.Price);
  }

  // Sort by Year
  if (selectedYearSort === 'new-old') {
    filteredVehicles.sort((a, b) => b.Year - a.Year);
  } else if (selectedYearSort === 'old-new') {
    filteredVehicles.sort((a, b) => a.Year - b.Year);
  }

  // Display the filtered vehicles
  displayVehicles(filteredVehicles);
}

// Display the filtered vehicles
function displayVehicles(vehicles) {
  const vehicleList = document.getElementById("vehicle-list");
  vehicleList.innerHTML = '';

  vehicles.forEach(vehicle => {
    const vehicleDiv = document.createElement("div");
    vehicleDiv.classList.add("vehicle-item");
    const priceFormatted = vehicle.Price && !isNaN(vehicle.Price) ? vehicle.Price.toLocaleString() : 'N/A';
    const mileageFormatted = vehicle["Mileage (km)"] ? `${vehicle["Mileage (km)"]} KM` : 'N/A';

    // Create the base HTML structure
    let vehicleHTML = `
      <h3>${vehicle.Year} ${vehicle.Manufacturer} ${vehicle.Model}</h3>
      <p><strong>Mileage:</strong> ${mileageFormatted}</p>
      <p><strong>Condition:</strong> ${vehicle.Condition}</p>
      <p><strong>Price:</strong> R ${priceFormatted}</p>
    `;

    // Add Dekra field only for cars database
    if (currentDatabase === 'cars' && vehicle.Dekra) {
      vehicleHTML += `<p><strong>Dekra:</strong> ${vehicle.Dekra}</p>`;
    }

    vehicleDiv.innerHTML = vehicleHTML;
    vehicleList.appendChild(vehicleDiv);
  });
}

// Initialize the page with motorcycles database
loadDatabaseData('bikes');

// Event listeners
document.getElementById("make").addEventListener("change", updateModelOptions);
document.getElementById("model").addEventListener("change", filterVehicles);
document.getElementById("price-sort").addEventListener("change", filterVehicles);
document.getElementById("year-sort").addEventListener("change", filterVehicles);