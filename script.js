let vehicles = [];
let currentDatabase = 'bikes';
let selectedModelDetails = new Map(); // Will store {model: make} pairs

// Updated loadDatabaseData function to load local JSON files
async function loadDatabaseData(database) {
  try {
    const filename = database === 'bikes' ? 'motorcycles.json' : 'cars.json';
    const response = await fetch(filename);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    vehicles = await response.json();
    
    // Update make dropdown with available manufacturers
    const makeSelect = document.getElementById("make");
    makeSelect.innerHTML = '<option value="">--Select Make--</option>';
    
    // Get unique manufacturers and sort them
    const manufacturers = [...new Set(vehicles.map(vehicle => vehicle.Manufacturer))].sort();
    
    // Add manufacturer options
    manufacturers.forEach(manufacturer => {
      const option = document.createElement("option");
      option.value = manufacturer;
      option.textContent = manufacturer;
      makeSelect.appendChild(option);
    });
    
    // Clear any existing selections and filtered results
    selectedModelDetails.clear();
    document.getElementById("vehicle-list").innerHTML = '';
    document.getElementById("summary").innerHTML = '';
    if (document.getElementById("selected-models")) {
      document.getElementById("selected-models").innerHTML = '';
    }
  } catch (error) {
    console.error('Error loading vehicle data:', error);
    alert('Error loading vehicle data. Please try again later.');
  }
}

function handleDatabaseToggle(event) {
  const database = event.target.checked ? 'cars' : 'bikes';
  currentDatabase = database;
  
  // Clear all selections and filters
  selectedModelDetails.clear();
  document.getElementById('make').value = '';
  document.getElementById('model').value = '';
  document.getElementById('price-sort').value = '';
  document.getElementById('year-sort').value = '';
  
  // Clear displayed vehicles and summary
  document.getElementById('vehicle-list').innerHTML = '';
  document.getElementById('summary').innerHTML = '';
  
  // Clear selected models display
  const selectedModelsContainer = document.getElementById('selected-models');
  if (selectedModelsContainer) {
    selectedModelsContainer.innerHTML = '';
  }
  
  // Fetch new data
  loadDatabaseData(database);
}

// Function to get the main model from a model string
function getMainModel(modelString) {
  // Get the first word (letters/numbers not separated by space)
  return modelString.split(' ')[0];
}

// Function to group models by their main model
function groupModelsByMain(models) {
  const groupedModels = new Map();
  
  models.forEach(model => {
    const mainModel = getMainModel(model);
    if (!groupedModels.has(mainModel)) {
      groupedModels.set(mainModel, new Set());
    }
    // Add the main model itself if it exists as a standalone model
    if (model === mainModel) {
      groupedModels.get(mainModel).add(mainModel);
    }
    // Add other variants
    if (model !== mainModel) {
      groupedModels.get(mainModel).add(model);
    }
  });
  
  // Convert Sets to sorted Arrays
  const sortedGroupedModels = new Map();
  groupedModels.forEach((subModels, mainModel) => {
    sortedGroupedModels.set(mainModel, Array.from(subModels).sort());
  });
  
  return sortedGroupedModels;
}


// Function to update model options based on selected make
function updateModelOptions() {
  const makeSelect = document.getElementById("make");
  const modelSelect = document.getElementById("model");
  const selectedMake = makeSelect.value;

  // Remove existing model tree if present
  const existingTree = document.querySelector('.model-tree');
  if (existingTree) {
      existingTree.remove();
  }

  if (selectedMake) {
      modelSelect.style.display = 'none'; // Hide the original select

      // Get all models for the selected make
      const models = [...new Set(vehicles.filter(vehicle => vehicle.Manufacturer === selectedMake).map(vehicle => vehicle.Model))].sort();

      // Group models by their main model
      const groupedModels = groupModelsByMain(models);

      // Create the tree structure
      const tree = document.createElement('div');
      tree.className = 'model-tree';

      groupedModels.forEach((subModels, mainModel) => {
          const groupDiv = document.createElement('div');
          groupDiv.className = 'model-group';

          const mainModelDiv = document.createElement('div');
          mainModelDiv.className = 'main-model';
          mainModelDiv.textContent = mainModel;
          mainModelDiv.onclick = () => handleModelSelection(mainModel, selectedMake, true);
          groupDiv.appendChild(mainModelDiv);

          // Add sub-models if they exist
          if (subModels.length > 1 || (subModels.length === 1 && subModels[0] !== mainModel)) {
              const subModelsDiv = document.createElement('div');
              subModelsDiv.className = 'sub-models';
              subModels.forEach(subModel => {
                  if (subModel !== mainModel) { // Don't duplicate the main model
                      const subModelDiv = document.createElement('div');
                      subModelDiv.className = 'sub-model';
                      subModelDiv.textContent = subModel;
                      subModelDiv.onclick = () => handleModelSelection(subModel, selectedMake, false);
                      subModelsDiv.appendChild(subModelDiv);
                  }
              });
              groupDiv.appendChild(subModelsDiv);
          }
          tree.appendChild(groupDiv);
      });

      // Insert the tree after the model select element
      modelSelect.parentNode.insertBefore(tree, modelSelect.nextSibling);
  } else {
      // If no make is selected, show the original empty select
      modelSelect.style.display = 'block';
      modelSelect.innerHTML = '';
  }

  // Add click handler for the make select to show the tree again
  makeSelect.addEventListener('click', () => {
      const tree = document.querySelector('.model-tree');
      if (tree) {
          tree.classList.remove('hidden'); // Ensure it's visible when clicked
      }
  });
}


// Update handleModelSelection to handle main models and sub-models
function handleModelSelection(selectedModel, selectedMake, isMainModel) {
  if (isMainModel) {
    // Get all models that start with the main model
    const relatedModels = vehicles
      .filter(vehicle => vehicle.Manufacturer === selectedMake && 
              getMainModel(vehicle.Model) === selectedModel)
      .map(vehicle => vehicle.Model);
    
    // Add all related models to the selection
    relatedModels.forEach(model => {
      if (!selectedModelDetails.has(model)) {
        selectedModelDetails.set(model, selectedMake);
      }
    });
  } else {
    // Handle single model selection
    if (!selectedModelDetails.has(selectedModel)) {
      selectedModelDetails.set(selectedModel, selectedMake);
    } else {
      selectedModelDetails.delete(selectedModel);
    }
  }
  
  updateSelectedModelsList();
  updateModelOptions(); // Update to refresh visual feedback
  filterVehicles();
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
  updateModelOptions();
  filterVehicles();
}

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

loadDatabaseData('bikes');

// Update event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('database-toggle').addEventListener('change', handleDatabaseToggle);
  document.getElementById("make").addEventListener("change", updateModelOptions);
  document.getElementById("price-sort").addEventListener("change", filterVehicles);
  document.getElementById("year-sort").addEventListener("change", filterVehicles);
});