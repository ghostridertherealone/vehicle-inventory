let vehicles = [];
let currentDatabase = 'bikes';
let selectedModelDetails = new Map(); // Will store {model: make} pairs

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

// Update updateModelOptions to not clear selected models
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
      // Only add to dropdown if not already selected
      if (!selectedModelDetails.has(model)) {
        const option = document.createElement("option");
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      }
    });
  }
}
// Update handleModelSelection to store make information
function handleModelSelection() {
  const modelSelect = document.getElementById("model");
  const makeSelect = document.getElementById("make");
  const selectedModel = modelSelect.value;
  const selectedMake = makeSelect.value;
  
  if (selectedModel && !selectedModelDetails.has(selectedModel)) {
    selectedModelDetails.set(selectedModel, selectedMake);
    updateSelectedModelsList();
    filterVehicles();
  }
  
  // Reset the select element
  modelSelect.value = "";
  // Update model options to remove selected model
  updateModelOptions();
}

function updateSelectedModelsList() {
  let selectedModelsContainer = document.getElementById("selected-models");
  if (!selectedModelsContainer) {
    selectedModelsContainer = document.createElement("div");
    selectedModelsContainer.id = "selected-models";
    document.querySelector(".filters").after(selectedModelsContainer);
  }

  selectedModelsContainer.innerHTML = '';

  // Create chip for each selected model
  selectedModelDetails.forEach((make, model) => {
    const chip = document.createElement("span");
    chip.className = "model-chip";
    chip.innerHTML = `${make} ${model} <button class="remove-model" onclick="removeModel('${model}')">&times;</button>`;
    selectedModelsContainer.appendChild(chip);
  });

  // Add clear all button if there are selections
  if (selectedModelDetails.size > 0) {
    const clearAllBtn = document.createElement("button");
    clearAllBtn.className = "clear-all-btn";
    clearAllBtn.textContent = "Clear all selections";
    clearAllBtn.onclick = clearAllModels;
    selectedModelsContainer.appendChild(clearAllBtn);
  }
}
function removeModel(model) {
  selectedModelDetails.delete(model);
  updateSelectedModelsList();
  // Update model options as this model is now available again
  updateModelOptions();
  filterVehicles();
}

// Update clearAllModels
function clearAllModels() {
  selectedModelDetails.clear();
  updateSelectedModelsList();
  updateModelOptions();
  filterVehicles();
}
function filterVehicles() {
  const priceSortSelect = document.getElementById("price-sort");
  const yearSortSelect = document.getElementById("year-sort");
  const selectedPriceSort = priceSortSelect.value;
  const selectedYearSort = yearSortSelect.value;

  if (selectedModelDetails.size === 0) {
    document.getElementById("vehicle-list").innerHTML = '';
    document.getElementById("summary").innerHTML = '';
    return;
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    // Check if this vehicle's model is in our selected models
    // and if its make matches the make we stored for that model
    return selectedModelDetails.has(vehicle.Model) && 
           selectedModelDetails.get(vehicle.Model) === vehicle.Manufacturer;
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

  displaySummary(filteredVehicles);
  displayVehicles(filteredVehicles);
}

function displaySummary(filteredVehicles) {
  const summaryElement = document.getElementById("summary");
  
  // Check if there are enough vehicles
  if (filteredVehicles.length < 6) {
    summaryElement.innerHTML = `
      <div class="insufficient-data">
        <h2>Price Ranges</h2>
        <p>There are not enough vehicles of this model to accurately determine price and mileage ranges.</p>
      </div>
    `;
    return;
  }

  // Sort vehicles by price
  const sortedVehicles = [...filteredVehicles].sort((a, b) => a.Price - b.Price);

  const totalVehicles = sortedVehicles.length;
  const lowClassCount = Math.floor(totalVehicles / 3);
  const middleClassCount = Math.floor(totalVehicles / 3);
  
  const lowClassVehicles = sortedVehicles.slice(0, lowClassCount);
  const middleClassVehicles = sortedVehicles.slice(lowClassCount, lowClassCount + middleClassCount);
  const highClassVehicles = sortedVehicles.slice(lowClassCount + middleClassCount);

  // Helper function to clean and parse mileage
  const parseMileage = (mileageStr) => {
    if (!mileageStr || mileageStr === "UNVERIFIED") return null;
    // Remove 'km' and any spaces, then parse the number
    return parseInt(mileageStr.toString().replace(/\s+/g, '').replace('km', ''));
  };

  // Helper function to safely get number ranges
  const getRange = (vehicles, property) => {
    if (property === "Mileage (km)") {
      const validMileages = vehicles
        .map(v => parseMileage(v[property]))
        .filter(val => val !== null && !isNaN(val));
      
      if (validMileages.length === 0) return 'No verified mileage data';
      
      return `${Math.min(...validMileages).toLocaleString()} - ${Math.max(...validMileages).toLocaleString()}`;
    } else if (property === "Year") {
      const validValues = vehicles
        .map(v => v[property])
        .filter(val => val !== null && !isNaN(val));
      
      if (validValues.length === 0) return 'N/A';
      
      // Don't use toLocaleString() for years to avoid commas
      return `${Math.min(...validValues)} - ${Math.max(...validValues)}`;
    } else {
      const validValues = vehicles
        .map(v => v[property])
        .filter(val => val !== null && !isNaN(val));
      
      if (validValues.length === 0) return 'N/A';
      
      return `${Math.min(...validValues).toLocaleString()} - ${Math.max(...validValues).toLocaleString()}`;
    }
  };

  const summary = {
    LowClass: {
      PriceRange: getRange(lowClassVehicles, 'Price'),
      MileageRange: getRange(lowClassVehicles, 'Mileage (km)'),
      YearRange: getRange(lowClassVehicles, 'Year')
    },
    MiddleClass: {
      PriceRange: getRange(middleClassVehicles, 'Price'),
      MileageRange: getRange(middleClassVehicles, 'Mileage (km)'),
      YearRange: getRange(middleClassVehicles, 'Year')
    },
    HighClass: {
      PriceRange: getRange(highClassVehicles, 'Price'),
      MileageRange: getRange(highClassVehicles, 'Mileage (km)'),
      YearRange: getRange(highClassVehicles, 'Year')
    }
  };

  // Display summary
  summaryElement.innerHTML = `
    <h2>Price Guide</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Lower Third</h3>
        <p><strong>Price Range:</strong> R ${summary.LowClass.PriceRange}</p>
        <p><strong>Mileage Range:</strong> ${summary.LowClass.MileageRange} km</p>
        <p><strong>Year Range:</strong> ${summary.LowClass.YearRange}</p>
      </div>
      <div class="summary-card">
        <h3>Middle Third</h3>
        <p><strong>Price Range:</strong> R ${summary.MiddleClass.PriceRange}</p>
        <p><strong>Mileage Range:</strong> ${summary.MiddleClass.MileageRange} km</p>
        <p><strong>Year Range:</strong> ${summary.MiddleClass.YearRange}</p>
      </div>
      <div class="summary-card">
        <h3>Upper Third</h3>
        <p><strong>Price Range:</strong> R ${summary.HighClass.PriceRange}</p>
        <p><strong>Mileage Range:</strong> ${summary.HighClass.MileageRange} km</p>
        <p><strong>Year Range:</strong> ${summary.HighClass.YearRange}</p>
      </div>
    </div>
  `;
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

// Update event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("make").addEventListener("change", updateModelOptions);
  document.getElementById("model").addEventListener("change", handleModelSelection);
  document.getElementById("price-sort").addEventListener("change", filterVehicles);
  document.getElementById("year-sort").addEventListener("change", filterVehicles);
});