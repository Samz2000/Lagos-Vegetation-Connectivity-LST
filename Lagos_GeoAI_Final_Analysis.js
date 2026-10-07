// ==========================================
// LEKKI–AJAH URBAN GREEN SPACE STUDY
// Step 1: Define study area
// ==========================================

var studyArea = ee.Geometry.Rectangle([
  3.48, 6.40,   // Southwest
  3.68, 6.55    // Northeast
]);

Map.centerObject(studyArea, 12);

Map.addLayer(
  studyArea,
  {color: 'red'},
  'Lekki–Ajah Study Area'
);

print('Study Area:', studyArea);
// ==========================================
// Step 2: Load Sentinel-2 imagery
// ==========================================

var sentinel2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(studyArea)
  .filterDate('2025-01-01', '2025-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

print('Sentinel-2 images:', sentinel2);
print('Number of images:', sentinel2.size());
// ==========================================
// Step 3: Create Sentinel-2 composite
// ==========================================

var composite2025 = sentinel2.median();

print('2025 Sentinel-2 composite:', composite2025);
// ==========================================
// Step 4: Display Sentinel-2 image
// ==========================================

var rgb2025 = composite2025.select([
  'B4',  // Red
  'B3',  // Green
  'B2'   // Blue
]);

Map.addLayer(
  rgb2025,
  {
    min: 0,
    max: 3000
  },
  'Sentinel-2 2025 RGB'
);
// ==========================================
// Step 5: Calculate NDVI
// ==========================================

var ndvi2025 = composite2025
  .normalizedDifference(['B8', 'B4'])
  .rename('NDVI');

Map.addLayer(
  ndvi2025,
  {
    min: -0.2,
    max: 0.8,
    palette: ['brown', 'yellow', 'green']
  },
  'NDVI 2025 - Vegetation'
);
  
  

print('NDVI 2025:', ndvi2025);
// ==========================================
// Step 6: Calculate NDBI
// ==========================================

var ndbi2025 = composite2025
  .normalizedDifference(['B11', 'B8'])
  .rename('NDBI');

Map.addLayer(
  ndbi2025,
  {
    min: -0.5,
    max: 0.5,
    palette: ['green', 'yellow', 'red']
  },
  'NDBI 2025 - Built-up'
);


print('NDBI 2025:', ndbi2025);
// ==========================================
// Step 7: Load Landsat 8/9
// ==========================================

var landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(studyArea)
  .filterDate('2025-01-01', '2025-12-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 20));

print('Landsat images:', landsat);
print('Number of Landsat images:', landsat.size());
// ==========================================
// Step 8: Create Landsat composite
// ==========================================

var landsatComposite = landsat.median();

print('Landsat 2025 composite:', landsatComposite);
// ==========================================
// Step 9: Extract Land Surface Temperature
// ==========================================

var lst2025 = landsatComposite
  .select('ST_B10');

print('Landsat Surface Temperature band:', lst2025);
// ==========================================
// Step 10: Convert Land Surface Temperature
// to degrees Celsius
// ==========================================

var lstCelsius2025 = lst2025
  .multiply(0.00341802)
  .add(149.0)
  .subtract(273.15)
  .rename('LST_C');

print('LST 2025 (°C):', lstCelsius2025);
// ==========================================
// Step 11: Display Land Surface Temperature
// ==========================================

Map.addLayer(
  lstCelsius2025,
  {
    min: 20,
    max: 40
  },
  'Land Surface Temperature 2025'
);
// ==========================================
// Step 12: Improve LST visualization
// ==========================================

Map.addLayer(
  lstCelsius2025,
  {
    min: 22,
    max: 38
  },
  'LST 2025 - Improved'
);
// ==========================================
// Step 15: Combine NDVI and LST
// ==========================================

var ndviLST2025 = ndvi2025.addBands(lstCelsius2025);

print('NDVI + LST 2025:', ndviLST2025);
// ==========================================
// Step 16: Remove invalid LST values
// ==========================================

var validLST2025 = lstCelsius2025.updateMask(
  lstCelsius2025.gt(0)
);

Map.addLayer(
  validLST2025,
  {
    min: 22,
    max: 38,
    palette: ['blue', 'cyan', 'yellow', 'orange', 'red']
  },
  'Valid LST 2025'
);
// ==========================================
// Step 18: Calculate average LST
// ==========================================

var meanLST = validLST2025.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: studyArea,
  scale: 30,
  maxPixels: 1e9
});

print('Average LST 2025 (°C):', meanLST);
print('Mean LST result:', meanLST);
// ==========================================
// Step 19: Calculate average NDVI
// ==========================================

var meanNDVI = ndvi2025.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e9
});

print('Mean NDVI 2025:', meanNDVI);
// ==========================================
// Step 20: Create clean NDVI + LST dataset
// ==========================================

var cleanNDVI_LST = ndvi2025
  .addBands(validLST2025);

print('Clean NDVI + LST:', cleanNDVI_LST);
// ==========================================
// Step 21: Create LST zones
// ==========================================

var lstZones = validLST2025
  .where(validLST2025.lt(28), 1)
  .where(validLST2025.gte(28).and(validLST2025.lt(32)), 2)
  .where(validLST2025.gte(32), 3)
  .rename('LST_Zones');

Map.addLayer(
  lstZones,
  {
    min: 1,
    max: 3,
    palette: ['blue', 'yellow', 'red']
  },
  'LST Temperature Zones'
);

print('LST zones:', lstZones);
// ==========================================
// Step 22: Create NDVI vegetation zones
// ==========================================

var vegetationZones = ndvi2025
  .where(ndvi2025.lt(0.2), 1)
  .where(ndvi2025.gte(0.2).and(ndvi2025.lt(0.5)), 2)
  .where(ndvi2025.gte(0.5), 3)
  .rename('Vegetation_Zones');

Map.addLayer(
  vegetationZones,
  {
    min: 1,
    max: 3,
    palette: ['red', 'yellow', 'green']
  },
  'Vegetation Zones'
);

print('Vegetation zones:', vegetationZones);
// ==========================================
// Step 24: Calculate NDVI-LST correlation
// ==========================================

var correlation = cleanNDVI_LST.reduceRegion({
  reducer: ee.Reducer.pearsonsCorrelation(),
  geometry: studyArea,
  scale: 30,
  maxPixels: 1e9
});

print('NDVI-LST correlation:', correlation);
// ==========================================
// Step 25: Sample NDVI and LST values
// ==========================================

var ndviLSTSamples = cleanNDVI_LST.sample({
  region: studyArea,
  scale: 30,
  numPixels: 3000,
  geometries: false,
  seed: 42
});

print('NDVI-LST samples:', ndviLSTSamples);
// ==========================================
// Step 26: Plot NDVI against LST
// ==========================================

var ndviLSTChart = ui.Chart.feature.byFeature(
  ndviLSTSamples,
  'NDVI',
  'LST_C'
)
.setChartType('ScatterChart')
.setOptions({
  title: 'NDVI vs Land Surface Temperature - 2025',
  hAxis: {
    title: 'NDVI'
  },
  vAxis: {
    title: 'Land Surface Temperature (°C)'
  },
  pointSize: 2,
  trendlines: {
    0: {
      showR2: true,
      visibleInLegend: true
    }
  }
});

print(ndviLSTChart);
// ==========================================
// Step 27: Separate vegetation groups
// ==========================================

var lowVegetation = ndvi2025.lt(0.2);

var mediumVegetation = ndvi2025.gte(0.2)
  .and(ndvi2025.lt(0.5));

var highVegetation = ndvi2025.gte(0.5);

print('Low vegetation mask:', lowVegetation);
print('Medium vegetation mask:', mediumVegetation);
print('High vegetation mask:', highVegetation);
// ==========================================
// Step 28: Average LST by vegetation level
// ==========================================

var lowVegLST = validLST2025
  .updateMask(lowVegetation)
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

var mediumVegLST = validLST2025
  .updateMask(mediumVegetation)
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

var highVegLST = validLST2025
  .updateMask(highVegetation)
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

print('Low vegetation - Mean LST:', lowVegLST);
print('Medium vegetation - Mean LST:', mediumVegLST);
print('High vegetation - Mean LST:', highVegLST);
// ==========================================
// Step 29: Count pixels in each vegetation group
// ==========================================

var lowVegCount = lowVegetation.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e9
});

var mediumVegCount = mediumVegetation.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e9
});

var highVegCount = highVegetation.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e9
});

print('Low vegetation pixels:', lowVegCount);
print('Medium vegetation pixels:', mediumVegCount);
print('High vegetation pixels:', highVegCount);
// ==========================================
// Step 30: Properly count vegetation pixels
// ==========================================

var lowVegPixels = lowVegetation.selfMask().reduceRegion({
  reducer: ee.Reducer.count(),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e9
});

var mediumVegPixels = mediumVegetation.selfMask().reduceRegion({
  reducer: ee.Reducer.count(),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e9
});

var highVegPixels = highVegetation.selfMask().reduceRegion({
  reducer: ee.Reducer.count(),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e9
});

print('Actual low vegetation pixel count:', lowVegPixels);
print('Actual medium vegetation pixel count:', mediumVegPixels);
print('Actual high vegetation pixel count:', highVegPixels);
// ==========================================
// Step 31: Calculate vegetation percentages
// ==========================================


// ==========================================
// Step 31: Calculate vegetation percentages
// ==========================================

var lowCount = ee.Number(lowVegPixels.get('NDVI'));
var mediumCount = ee.Number(mediumVegPixels.get('NDVI'));
var highCount = ee.Number(highVegPixels.get('NDVI'));

var totalVegPixels = lowCount
  .add(mediumCount)
  .add(highCount);

var lowVegPercent = lowCount
  .divide(totalVegPixels)
  .multiply(100);

var mediumVegPercent = mediumCount
  .divide(totalVegPixels)
  .multiply(100);

var highVegPercent = highCount
  .divide(totalVegPixels)
  .multiply(100);

print('Low vegetation percentage:', lowVegPercent);
print('Medium vegetation percentage:', mediumVegPercent);
print('High vegetation percentage:', highVegPercent);


// ==========================================
// Step 32: Vegetation vs Mean LST
// ==========================================

var vegetationLSTChart = ui.Chart.array.values(
  ee.Array([
    29.5,
    31.86,
    29.8
  ]),
  0,
  ee.List([
    'Low vegetation',
    'Medium vegetation',
    'High vegetation'
  ])
)
.setChartType('ColumnChart')
.setOptions({
  title: 'Mean LST by Vegetation Class - 2025',
  hAxis: {
    title: 'Vegetation Class'
  },
  vAxis: {
    title: 'Mean Land Surface Temperature (°C)'
  },
  legend: {
    position: 'none'
  }
});

print(vegetationLSTChart);
// ==========================================
// Step 33: Display vegetation classes
// ==========================================

Map.addLayer(
  vegetationZones,
  {
    min: 1,
    max: 3,
    palette: ['red', 'yellow', 'green']
  },
  'Vegetation Pattern 2025'
);
// ==========================================
// Step 34: Identify high-vegetation patches
// ==========================================

var highVegPatches = highVegetation
  .selfMask()
  .connectedComponents({
    connectedness: ee.Kernel.plus(1),
    maxSize: 1024
  });

Map.addLayer(
  highVegPatches.select('labels'),
  {},
  'High Vegetation Patches'
);

print('High vegetation patches:', highVegPatches);

// ==========================================
// Step 35: Calculate high-vegetation patch area
// ==========================================

var highVegPatchArea = highVegPatches
  .select('labels')
  .connectedPixelCount(256, true)
  .multiply(100)
  .rename('Patch_Area_m2');

Map.addLayer(
  highVegPatchArea,
  {
    min: 0,
    max: 50000
  },
  'High Vegetation Patch Area'
);

print('High vegetation patch area:', highVegPatchArea);
// ==========================================
// Step 36: Find the largest high-vegetation patch
// ==========================================

var largestPatch = highVegPatchArea.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e9
});

print('Largest high-vegetation patch (m²):', largestPatch);

// ==========================================
// Step 37: Calculate total high-vegetation area
// ==========================================

var highVegArea = highVegetation
  .selfMask()
  .multiply(ee.Image.pixelArea())
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

print('Total high-vegetation area (m²):', highVegArea);
// ==========================================
// Step 38: Mean LST in high-vegetation areas
// ==========================================

var highVegLST = validLST2025
  .updateMask(highVegetation)
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

print('Mean LST in high-vegetation areas (°C):', highVegLST);
// ==========================================
// Step 39: Compare low and high vegetation LST
// ==========================================

var lowLST = ee.Number(lowVegLST.get('LST_C'));
var highLST = ee.Number(highVegLST.get('LST_C'));

var temperatureDifference = lowLST.subtract(highLST);

print(
  'Low vegetation minus high vegetation LST (°C):',
  temperatureDifference
);
// ==========================================
// Step 40: NDVI-LST correlation by vegetation class
// ==========================================

var lowVegCorrelation = cleanNDVI_LST
  .updateMask(lowVegetation)
  .reduceRegion({
    reducer: ee.Reducer.pearsonsCorrelation(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

var mediumVegCorrelation = cleanNDVI_LST
  .updateMask(mediumVegetation)
  .reduceRegion({
    reducer: ee.Reducer.pearsonsCorrelation(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

var highVegCorrelation = cleanNDVI_LST
  .updateMask(highVegetation)
  .reduceRegion({
    reducer: ee.Reducer.pearsonsCorrelation(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

print('Low vegetation NDVI-LST correlation:', lowVegCorrelation);
print('Medium vegetation NDVI-LST correlation:', mediumVegCorrelation);
print('High vegetation NDVI-LST correlation:', highVegCorrelation);
var lowVegSamples = cleanNDVI_LST
  .updateMask(lowVegetation)
  .sample({
    region: studyArea,
    scale: 30,
    numPixels: 2000,
    geometries: false,
    seed: 42
  });

var lowVegChart = ui.Chart.feature.byFeature(
  lowVegSamples,
  'NDVI',
  'LST_C'
)
.setChartType('ScatterChart')
.setOptions({
  title: 'NDVI vs LST - Low Vegetation Areas',
  hAxis: {
    title: 'NDVI'
  },
  vAxis: {
    title: 'Land Surface Temperature (°C)'
  },
  pointSize: 2,
  trendlines: {
    0: {
      showR2: true,
      visibleInLegend: true
    }
  }
});

print(lowVegChart);
var lowVegNDVIStats = ndvi2025
  .updateMask(lowVegetation)
  .reduceRegion({
    reducer: ee.Reducer.minMax(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

print('Low vegetation NDVI range:', lowVegNDVIStats);
var veryLowNDVI = ndvi2025.lt(0);

var lowPositiveNDVI = ndvi2025
  .gte(0)
  .and(ndvi2025.lt(0.2));

print('Very low NDVI mask:', veryLowNDVI);
print('Low positive NDVI mask:', lowPositiveNDVI);
var veryLowLST = validLST2025
  .updateMask(veryLowNDVI)
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

var lowPositiveLST = validLST2025
  .updateMask(lowPositiveNDVI)
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

print('Very low NDVI (<0) - Mean LST:', veryLowLST);
print('Low positive NDVI (0–0.2) - Mean LST:', lowPositiveLST);
var veryLowCount = veryLowNDVI
  .selfMask()
  .reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

var lowPositiveCount = lowPositiveNDVI
  .selfMask()
  .reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

print('Very low NDVI pixel count:', veryLowCount);
print('Low positive NDVI pixel count:', lowPositiveCount);
var totalLowNDVIPixels = ee.Number(veryLowCount.get('NDVI'))
  .add(ee.Number(lowPositiveCount.get('NDVI')));

var veryLowPercent = ee.Number(veryLowCount.get('NDVI'))
  .divide(totalLowNDVIPixels)
  .multiply(100);

var lowPositivePercent = ee.Number(lowPositiveCount.get('NDVI'))
  .divide(totalLowNDVIPixels)
  .multiply(100);

print('Very low NDVI percentage:', veryLowPercent);
print('Low positive NDVI percentage:', lowPositivePercent);
Map.addLayer(
  veryLowNDVI.selfMask(),
  {palette: ['blue']},
  'Very Low NDVI (<0)'
);

Map.addLayer(
  lowPositiveNDVI.selfMask(),
  {palette: ['yellow']},
  'Low Positive NDVI (0–0.2)'
);
var ndwi2025 = composite2025
  .normalizedDifference(['B3', 'B8'])
  .rename('NDWI');

Map.addLayer(
  ndwi2025,
  {
    min: -0.5,
    max: 0.5,
    palette: ['brown', 'white', 'blue']
  },
  'NDWI 2025'
);

print('NDWI 2025:', ndwi2025);
Map.addLayer(
  ndbi2025,
  {
    min: -0.5,
    max: 0.5,
    palette: ['green', 'yellow', 'red']
  },
  'NDBI 2025 - Built-up Check'
);

print('NDBI within very low NDVI:', ndbi2025.updateMask(veryLowNDVI));
var nonVegetation = ndvi2025.lt(0.2);

var moderateVegetation = ndvi2025
  .gte(0.2)
  .and(ndvi2025.lt(0.5));

var highVegetationNew = ndvi2025.gte(0.5);

print('Non-/sparse vegetation:', nonVegetation);
print('Moderate vegetation:', moderateVegetation);
print('High vegetation:', highVegetationNew);
var nonVegLST = validLST2025
  .updateMask(nonVegetation)
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

print(
  'Mean LST - Non/sparse vegetation (NDVI < 0.2):',
  nonVegLST
);
var nonVegPixels = nonVegetation
  .selfMask()
  .reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

var moderateVegPixels = moderateVegetation
  .selfMask()
  .reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

var highVegPixelsNew = highVegetationNew
  .selfMask()
  .reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

print('Non-/sparse vegetation pixels:', nonVegPixels);
print('Moderate vegetation pixels:', moderateVegPixels);
print('High vegetation pixels:', highVegPixelsNew);
var totalClassPixels = ee.Number(nonVegPixels.get('NDVI'))
  .add(ee.Number(moderateVegPixels.get('NDVI')))
  .add(ee.Number(highVegPixelsNew.get('NDVI')));

var nonVegPercent = ee.Number(nonVegPixels.get('NDVI'))
  .divide(totalClassPixels)
  .multiply(100);

var moderateVegPercent = ee.Number(moderateVegPixels.get('NDVI'))
  .divide(totalClassPixels)
  .multiply(100);

var highVegPercentNew = ee.Number(highVegPixelsNew.get('NDVI'))
  .divide(totalClassPixels)
  .multiply(100);

print('Non-/sparse vegetation percentage:', nonVegPercent);
print('Moderate vegetation percentage:', moderateVegPercent);
print('High vegetation percentage:', highVegPercentNew);
var improvedVegetationZones = nonVegetation
  .where(moderateVegetation, 2)
  .where(highVegetationNew, 3)
  .rename('Improved_Vegetation_Zones');

Map.addLayer(
  improvedVegetationZones,
  {
    min: 1,
    max: 3,
    palette: ['red', 'yellow', 'green']
  },
  'Improved Vegetation Classes 2025'
);

print(
  'Improved vegetation classification:',
  improvedVegetationZones
);
var highVegConnected = highVegetationNew
  .selfMask()
  .connectedComponents({
    connectedness: ee.Kernel.plus(1),
    maxSize: 1024
  });

Map.addLayer(
  highVegConnected.select('labels'),
  {},
  'High Vegetation Spatial Patches'
);

print(
  'High vegetation spatial patches:',
  highVegConnected
);
var highVegPatchCount = highVegConnected
  .select('labels')
  .reduceRegion({
    reducer: ee.Reducer.countDistinct(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

print(
  'Number of high-vegetation patches:',
  highVegPatchCount
);
var highVegAreaKm2 = highVegetationNew
  .selfMask()
  .multiply(ee.Image.pixelArea())
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

var highVegAreaKm2Value = ee.Number(
  highVegAreaKm2.get('NDVI')
).divide(1000000);

print(
  'Total high-vegetation area (km²):',
  highVegAreaKm2Value
);
var studyAreaArea = studyArea.area();

var highVegCoverage = ee.Number(
  highVegAreaKm2.get('NDVI')
)
.divide(1000000)
.divide(studyAreaArea.divide(1000000))
.multiply(100);

print(
  'Study area size (km²):',
  studyAreaArea.divide(1000000)
);

print(
  'High vegetation coverage (%):',
  highVegCoverage
);
var highVegEdge = highVegetationNew
  .selfMask()
  .reduceNeighborhood({
    reducer: ee.Reducer.count(),
    kernel: ee.Kernel.square(1),
    skipMasked: true
  });

Map.addLayer(
  highVegEdge,
  {
    min: 1,
    max: 8
  },
  'High Vegetation Neighborhood'
);

print(
  'High vegetation neighborhood:',
  highVegEdge
);
var vegetationConnectivity = highVegEdge
  .gte(5)
  .selfMask();

Map.addLayer(
  vegetationConnectivity,
  {
    palette: ['green']
  },
  'High Vegetation Connectivity'
);

print(
  'High vegetation connectivity:',
  vegetationConnectivity
);
var connectivityClasses = highVegEdge
  .where(highVegEdge.lte(3), 1)
  .where(highVegEdge.gte(4).and(highVegEdge.lte(6)), 2)
  .where(highVegEdge.gte(7), 3)
  .updateMask(highVegetationNew)
  .rename('Vegetation_Connectivity');

Map.addLayer(
  connectivityClasses,
  {
    min: 1,
    max: 3,
    palette: ['red', 'yellow', 'green']
  },
  'Vegetation Connectivity Classes'
);

print(
  'Vegetation connectivity classes:',
  connectivityClasses
);
var lowConnectivityPixels = connectivityClasses
  .eq(1)
  .selfMask()
  .reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

var mediumConnectivityPixels = connectivityClasses
  .eq(2)
  .selfMask()
  .reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

var highConnectivityPixels = connectivityClasses
  .eq(3)
  .selfMask()
  .reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

print('Low-connectivity pixels:', lowConnectivityPixels);
print('Medium-connectivity pixels:', mediumConnectivityPixels);
print('High-connectivity pixels:', highConnectivityPixels);
var highConnectivityCount = 287391;
var mediumConnectivityCount = 67907;
var lowConnectivityCount = 13410;

var totalConnectivityCount =
  highConnectivityCount +
  mediumConnectivityCount +
  lowConnectivityCount;

var highConnectivityPercent =
  highConnectivityCount / totalConnectivityCount * 100;

var mediumConnectivityPercent =
  mediumConnectivityCount / totalConnectivityCount * 100;

var lowConnectivityPercent =
  lowConnectivityCount / totalConnectivityCount * 100;

print(
  'High connectivity percentage:',
  highConnectivityPercent
);

print(
  'Medium connectivity percentage:',
  mediumConnectivityPercent
);

print(
  'Low connectivity percentage:',
  lowConnectivityPercent
);
var lowConnectivityLST = validLST2025
  .updateMask(connectivityClasses.eq(1))
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

var mediumConnectivityLST = validLST2025
  .updateMask(connectivityClasses.eq(2))
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

var highConnectivityLST = validLST2025
  .updateMask(connectivityClasses.eq(3))
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

print(
  'Low connectivity - Mean LST:',
  lowConnectivityLST
);

print(
  'Medium connectivity - Mean LST:',
  mediumConnectivityLST
);

print(
  'High connectivity - Mean LST:',
  highConnectivityLST
);
var connectivityLSTChart = ui.Chart.array.values(
  ee.Array([32.1, 30.5, 29.2]),
  0,
  ee.List([
    'Low connectivity',
    'Medium connectivity',
    'High connectivity'
  ])
)
.setChartType('ColumnChart')
.setOptions({
  title: 'Mean LST by Vegetation Connectivity - 2025',
  hAxis: {
    title: 'Vegetation Connectivity'
  },
  vAxis: {
    title: 'Mean Land Surface Temperature (°C)'
  },
  legend: {
    position: 'none'
  }
});

print(connectivityLSTChart);
var lowConnectivityCount30m = validLST2025
  .updateMask(connectivityClasses.eq(1))
  .reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

var mediumConnectivityCount30m = validLST2025
  .updateMask(connectivityClasses.eq(2))
  .reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

var highConnectivityCount30m = validLST2025
  .updateMask(connectivityClasses.eq(3))
  .reduceRegion({
    reducer: ee.Reducer.count(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

print(
  'Low connectivity LST pixel count:',
  lowConnectivityCount30m
);

print(
  'Medium connectivity LST pixel count:',
  mediumConnectivityCount30m
);

print(
  'High connectivity LST pixel count:',
  highConnectivityCount30m
);
var lowLSTValue = 32.1;
var mediumLSTValue = 30.5;
var highLSTValue = 29.2;

var lowMinusMedium = lowLSTValue - mediumLSTValue;
var mediumMinusHigh = mediumLSTValue - highLSTValue;
var lowMinusHigh = lowLSTValue - highLSTValue;

print(
  'Low connectivity minus Medium connectivity (°C):',
  lowMinusMedium
);

print(
  'Medium connectivity minus High connectivity (°C):',
  mediumMinusHigh
);

print(
  'Low connectivity minus High connectivity (°C):',
  lowMinusHigh
);
var totalConnectivityPixels =
  highConnectivityCount +
  mediumConnectivityCount +
  lowConnectivityCount;

var highConnectivityAreaPercent =
  highConnectivityCount
  / totalConnectivityPixels
  * 100;

var mediumConnectivityAreaPercent =
  mediumConnectivityCount
  / totalConnectivityPixels
  * 100;

var lowConnectivityAreaPercent =
  lowConnectivityCount
  / totalConnectivityPixels
  * 100;

print(
  'High connectivity area percentage:',
  highConnectivityAreaPercent
);

print(
  'Medium connectivity area percentage:',
  mediumConnectivityAreaPercent
);

print(
  'Low connectivity area percentage:',
  lowConnectivityAreaPercent
);
var highConnectivityAreaKm2 =
  highConnectivityCount
  * 100
  / 1000000;

var mediumConnectivityAreaKm2 =
  mediumConnectivityCount
  * 100
  / 1000000;

var lowConnectivityAreaKm2 =
  lowConnectivityCount
  * 100
  / 1000000;

print(
  'High connectivity area (km²):',
  highConnectivityAreaKm2
);

print(
  'Medium connectivity area (km²):',
  mediumConnectivityAreaKm2
);

print(
  'Low connectivity area (km²):',
  lowConnectivityAreaKm2
);
var connectivityLSTImage = connectivityClasses
  .addBands(validLST2025)
  .rename(['Connectivity', 'LST']);

var connectivityCorrelation = connectivityLSTImage
  .reduceRegion({
    reducer: ee.Reducer.pearsonsCorrelation(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e9
  });

print(
  'Connectivity-LST correlation:',
  connectivityCorrelation
);
var connectivitySamples = connectivityLSTImage.sample({
  region: studyArea,
  scale: 30,
  numPixels: 3000,
  geometries: false,
  seed: 42
});

var connectivityChart = ui.Chart.feature.byFeature(
  connectivitySamples,
  'Connectivity',
  'LST'
)
.setChartType('ScatterChart')
.setOptions({
  title: 'Vegetation Connectivity vs Land Surface Temperature - 2025',
  hAxis: {
    title: 'Vegetation Connectivity'
  },
  vAxis: {
    title: 'Land Surface Temperature (°C)'
  },
  pointSize: 3,
  trendlines: {
    0: {
      showR2: true,
      visibleInLegend: true
    }
  }
});

print(connectivityChart);
var coolingPercent = ee.Number(32.1)
  .subtract(ee.Number(29.2))
  .divide(ee.Number(32.1))
  .multiply(100);

print(
  'Temperature reduction from low to high connectivity (%):',
  coolingPercent
);
var lowToMediumCoolingPercent =
  ee.Number(32.1)
  .subtract(ee.Number(30.5))
  .divide(ee.Number(32.1))
  .multiply(100);

var mediumToHighCoolingPercent =
  ee.Number(30.5)
  .subtract(ee.Number(29.2))
  .divide(ee.Number(30.5))
  .multiply(100);

print(
  'Cooling from low to medium connectivity (%):',
  lowToMediumCoolingPercent
);

print(
  'Cooling from medium to high connectivity (%):',
  mediumToHighCoolingPercent
);
var lowConnectivityNDVI = ndvi2025
  .updateMask(connectivityClasses.eq(1))
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

var mediumConnectivityNDVI = ndvi2025
  .updateMask(connectivityClasses.eq(2))
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

var highConnectivityNDVI = ndvi2025
  .updateMask(connectivityClasses.eq(3))
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: studyArea,
    scale: 10,
    maxPixels: 1e9
  });

print(
  'Low connectivity - Mean NDVI:',
  lowConnectivityNDVI
);

print(
  'Medium connectivity - Mean NDVI:',
  mediumConnectivityNDVI
);

print(
  'High connectivity - Mean NDVI:',
  highConnectivityNDVI
);
var ndviDifference =
  ee.Number(0.64)
  .subtract(ee.Number(0.53));

print(
  'High connectivity minus Low connectivity NDVI:',
  ndviDifference
);
var ndviIncreasePercent =
  ee.Number(0.64)
  .subtract(ee.Number(0.53))
  .divide(ee.Number(0.53))
  .multiply(100);

print(
  'NDVI increase from low to high connectivity (%):',
  ndviIncreasePercent
);
var connectivityNDVIChart = ui.Chart.array.values(
  ee.Array([0.53, 0.55, 0.64]),
  0,
  ee.List([
    'Low connectivity',
    'Medium connectivity',
    'High connectivity'
  ])
)
.setChartType('ColumnChart')
.setOptions({
  title: 'Mean NDVI by Vegetation Connectivity - 2025',
  hAxis: {
    title: 'Vegetation Connectivity'
  },
  vAxis: {
    title: 'Mean NDVI'
  },
  legend: {
    position: 'none'
  }
});

print(connectivityNDVIChart);
var connectivityLSTSummaryChart = ui.Chart.array.values(
  ee.Array([32.1, 30.5, 29.2]),
  0,
  ee.List([
    'Low connectivity',
    'Medium connectivity',
    'High connectivity'
  ])
)
.setChartType('ColumnChart')
.setOptions({
  title: 'Mean LST by Vegetation Connectivity - 2025',
  hAxis: {
    title: 'Vegetation Connectivity'
  },
  vAxis: {
    title: 'Mean Land Surface Temperature (°C)'
  },
  legend: {
    position: 'none'
  }
});

print(connectivityLSTSummaryChart);
var connectivitySummary = ee.FeatureCollection([
  ee.Feature(null, {
    Connectivity: 'Low',
    Mean_NDVI: 0.53,
    Mean_LST_C: 32.1,
    Area_km2: 1.34
  }),
  ee.Feature(null, {
    Connectivity: 'Medium',
    Mean_NDVI: 0.55,
    Mean_LST_C: 30.5,
    Area_km2: 6.79
  }),
  ee.Feature(null, {
    Connectivity: 'High',
    Mean_NDVI: 0.64,
    Mean_LST_C: 29.2,
    Area_km2: 28.74
  })
]);

print(
  'Vegetation Connectivity Summary:',
  connectivitySummary
);
Export.table.toDrive({
  collection: connectivitySummary,
  description: 'Lekki_Ajah_Vegetation_Connectivity_Summary_2025',
  fileFormat: 'CSV'
});
var connectivityLSTSamples = validLST2025
  .addBands(connectivityClasses)
  .sample({
    region: studyArea,
    scale: 30,
    numPixels: 3000,
    geometries: false,
    seed: 42
  });

print(
  'Connectivity-LST samples:',
  connectivityLSTSamples
);
var lowLSTSamples = connectivityLSTSamples
  .filter(ee.Filter.eq('Vegetation_Connectivity', 1));

var mediumLSTSamples = connectivityLSTSamples
  .filter(ee.Filter.eq('Vegetation_Connectivity', 2));

var highLSTSamples = connectivityLSTSamples
  .filter(ee.Filter.eq('Vegetation_Connectivity', 3));

print('Low connectivity samples:', lowLSTSamples.size());
print('Medium connectivity samples:', mediumLSTSamples.size());
print('High connectivity samples:', highLSTSamples.size());
var lowLSTRange = lowLSTSamples
  .reduceColumns({
    reducer: ee.Reducer.minMax(),
    selectors: ['LST_C']
  });

var mediumLSTRange = mediumLSTSamples
  .reduceColumns({
    reducer: ee.Reducer.minMax(),
    selectors: ['LST_C']
  });

var highLSTRange = highLSTSamples
  .reduceColumns({
    reducer: ee.Reducer.minMax(),
    selectors: ['LST_C']
  });

print('Low connectivity LST range:', lowLSTRange);
print('Medium connectivity LST range:', mediumLSTRange);
print('High connectivity LST range:', highLSTRange);
var lstDistributionChart = ui.Chart.feature.histogram(
  connectivityLSTSamples,
  'LST_C',
  1
)
.setOptions({
  title: 'LST Distribution Across Connectivity Samples - 2025',
  hAxis: {
    title: 'Land Surface Temperature (°C)'
  },
  vAxis: {
    title: 'Number of Samples'
  },
  legend: {
    position: 'none'
  }
});

print(lstDistributionChart);
var highConnectivityLSTChart = ui.Chart.feature.histogram(
  highLSTSamples,
  'LST_C',
  1
)
.setOptions({
  title: 'LST Distribution - High Vegetation Connectivity',
  hAxis: {
    title: 'Land Surface Temperature (°C)'
  },
  vAxis: {
    title: 'Number of Samples'
  },
  legend: {
    position: 'none'
  }
});

print(highConnectivityLSTChart);
var lowConnectivityLSTChart = ui.Chart.feature.histogram(
  lowLSTSamples,
  'LST_C',
  1
)
.setOptions({
  title: 'LST Distribution - Low Vegetation Connectivity',
  hAxis: {
    title: 'Land Surface Temperature (°C)'
  },
  vAxis: {
    title: 'Number of Samples'
  },
  legend: {
    position: 'none'
  }
});

print(lowConnectivityLSTChart);
var mediumConnectivityLSTChart = ui.Chart.feature.histogram(
  mediumLSTSamples,
  'LST_C',
  1
)
.setOptions({
  title: 'LST Distribution - Medium Vegetation Connectivity',
  hAxis: {
    title: 'Land Surface Temperature (°C)'
  },
  vAxis: {
    title: 'Number of Samples'
  },
  legend: {
    position: 'none'
  }
});

print(mediumConnectivityLSTChart);
var finalConnectivityLSTChart = ui.Chart.array.values(
  ee.Array([32.1, 30.5, 29.2]),
  0,
  ee.List([
    'Low connectivity',
    'Medium connectivity',
    'High connectivity'
  ])
)
.setChartType('ColumnChart')
.setOptions({
  title: 'Mean Land Surface Temperature by Vegetation Connectivity - 2025',
  hAxis: {
    title: 'Vegetation Connectivity'
  },
  vAxis: {
    title: 'Mean Land Surface Temperature (°C)'
  },
  legend: {
    position: 'none'
  }
});

print(finalConnectivityLSTChart);
var lstReductionPercent = ee.Number(32.1)
  .subtract(ee.Number(29.2))
  .divide(ee.Number(32.1))
  .multiply(100);

print(
  'LST reduction from low to high connectivity (%):',
  lstReductionPercent
);
var lowToMediumLSTReduction = ee.Number(32.1)
  .subtract(ee.Number(30.5))
  .divide(ee.Number(32.1))
  .multiply(100);

print(
  'LST reduction from low to medium connectivity (%):',
  lowToMediumLSTReduction
);
var mediumToHighLSTReduction = ee.Number(30.5)
  .subtract(ee.Number(29.2))
  .divide(ee.Number(30.5))
  .multiply(100);

print(
  'LST reduction from medium to high connectivity (%):',
  mediumToHighLSTReduction
);
var lowToHighLSTReduction = ee.Number(32.0)
  .subtract(ee.Number(29.2))
  .divide(ee.Number(32.0))
  .multiply(100);

print(
  'LST reduction from low to high connectivity (%):',
  lowToHighLSTReduction
);
var lowToHighTemperatureDifference = ee.Number(32.0)
  .subtract(ee.Number(29.2));

print(
  'Temperature difference from low to high connectivity (°C):',
  lowToHighTemperatureDifference
);
var overallMeanLST = ee.Number(32.0)
  .add(ee.Number(30.5))
  .add(ee.Number(29.2))
  .divide(3);

print(
  'Overall mean LST across connectivity levels (°C):',
  overallMeanLST
);
var highVsMeanDifference = ee.Number(30.57)
  .subtract(ee.Number(29.2));

print(
  'How much cooler high connectivity is than the overall mean (°C):',
  highVsMeanDifference
);
var lowVsMeanDifference = ee.Number(32.0)
  .subtract(ee.Number(30.57));

print(
  'How much warmer low connectivity is than the overall mean (°C):',
  lowVsMeanDifference
);
var lowHighPercentageDifference = ee.Number(32.0)
  .subtract(ee.Number(29.2))
  .divide(ee.Number(29.2))
  .multiply(100);

print(
  'Percentage difference between low and high LST (%):',
  lowHighPercentageDifference
);
var lstRange = ee.Number(32.0)
  .subtract(ee.Number(29.2));

print(
  'Overall LST range across connectivity levels (°C):',
  lstRange
);
var averageLSTDecreasePerLevel = ee.Number(32.0)
  .subtract(ee.Number(29.2))
  .divide(2);

print(
  'Average LST decrease per connectivity level (°C):',
  averageLSTDecreasePerLevel
);
var mediumVsLowReduction = ee.Number(32.0)
  .subtract(ee.Number(30.5))
  .divide(ee.Number(32.0))
  .multiply(100);

var highVsLowReduction = ee.Number(32.0)
  .subtract(ee.Number(29.2))
  .divide(ee.Number(32.0))
  .multiply(100);

print(
  'Medium vs Low LST reduction (%):',
  mediumVsLowReduction
);

print(
  'High vs Low LST reduction (%):',
  highVsLowReduction
);
var connectivityLST = ee.FeatureCollection([
  ee.Feature(null, {
    connectivity: 'Low',
    LST: 32.0
  }),
  ee.Feature(null, {
    connectivity: 'Medium',
    LST: 30.5
  }),
  ee.Feature(null, {
    connectivity: 'High',
    LST: 29.2
  })
]);

print('Connectivity vs LST:', connectivityLST);
var connectivityCorrelationData = ee.FeatureCollection([
  ee.Feature(null, {
    connectivityScore: 1,
    LST: 32.0
  }),
  ee.Feature(null, {
    connectivityScore: 2,
    LST: 30.5
  }),
  ee.Feature(null, {
    connectivityScore: 3,
    LST: 29.2
  })
]);

print(
  'Connectivity-LST data:',
  connectivityCorrelationData
);
var connectivityLSTCorrelation =
  connectivityCorrelationData.reduceColumns({
    reducer: ee.Reducer.pearsonsCorrelation(),
    selectors: ['connectivityScore', 'LST']
  });

print(
  'Pearson correlation between connectivity and LST:',
  connectivityLSTCorrelation
);
var connectivityLSTChart = ui.Chart.feature.byFeature({
  features: connectivityCorrelationData,
  xProperty: 'connectivityScore',
  yProperties: ['LST']
})
.setChartType('ScatterChart')
.setOptions({
  title: 'Vegetation Connectivity vs LST',
  hAxis: {
    title: 'Connectivity Score (1 = Low, 2 = Medium, 3 = High)'
  },
  vAxis: {
    title: 'Land Surface Temperature (°C)'
  },
  pointSize: 7,
  trendlines: {
    0: {
      showR2: true,
      visibleInLegend: true
    }
  }
});

print(connectivityLSTChart);
// ==========================================
// Step 107: Mean LST by connectivity
// ==========================================

var lstBarChart = ui.Chart.feature.byFeature({
  features: connectivityLST,
  xProperty: 'connectivity',
  yProperties: ['LST']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Mean LST by Vegetation Connectivity',
  hAxis: {
    title: 'Vegetation Connectivity'
  },
  vAxis: {
    title: 'Mean LST (°C)'
  },
  legend: {
    position: 'none'
  }
});

print(lstBarChart);
// ==========================================
// Step 108: Overall cooling difference
// ==========================================

var overallCoolingDifference = ee.Number(32.0)
  .subtract(ee.Number(29.2));

print(
  'Overall LST difference between Low and High connectivity (°C):',
  overallCoolingDifference
);
// ==========================================
// Step 109: Percentage cooling
// ==========================================

var percentageCooling = ee.Number(32.0)
  .subtract(ee.Number(29.2))
  .divide(ee.Number(32.0))
  .multiply(100);

print(
  'Percentage cooling from Low to High connectivity (%):',
  percentageCooling
);
// ==========================================
// Step 110: Final LST summary chart
// ==========================================

var finalLSTChart = ui.Chart.feature.byFeature({
  features: connectivityLST,
  xProperty: 'connectivity',
  yProperties: ['LST']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Land Surface Temperature by Vegetation Connectivity',
  hAxis: {
    title: 'Vegetation Connectivity'
  },
  vAxis: {
    title: 'Mean LST (°C)'
  },
  legend: {
    position: 'none'
  }
});

print(finalLSTChart);
// ==========================================
// Step 111: Overall mean LST
// ==========================================

var overallMeanLST = ee.Number(32.0)
  .add(ee.Number(30.5))
  .add(ee.Number(29.2))
  .divide(3);

print(
  'Overall mean LST (°C):',
  overallMeanLST
);
// ==========================================
// Step 112: High connectivity vs overall mean
// ==========================================

var highVsOverallDifference = ee.Number(30.57)
  .subtract(ee.Number(29.2));

print(
  'High connectivity is cooler than overall mean by (°C):',
  highVsOverallDifference
);
// ==========================================
// Step 113: Low connectivity vs overall mean
// ==========================================

var lowVsOverallDifference = ee.Number(32.0)
  .subtract(ee.Number(30.57));

print(
  'Low connectivity is warmer than overall mean by (°C):',
  lowVsOverallDifference
);
// ==========================================
// Step 114: Overall LST range
// ==========================================

var overallLSTRange = ee.Number(32.0)
  .subtract(ee.Number(29.2));

print(
  'Overall LST range across connectivity levels (°C):',
  overallLSTRange
);
// ==========================================
// Step 115: Average LST decrease per connectivity level
// ==========================================

var averageLSTDecrease = ee.Number(32.0)
  .subtract(ee.Number(29.2))
  .divide(2);

print(
  'Average LST decrease per connectivity level (°C):',
  averageLSTDecrease
);
// ==========================================
// Step 116: Final connectivity-LST results
// ==========================================

var finalResults = ee.FeatureCollection([
  ee.Feature(null, {
    Connectivity: 'Low',
    Mean_LST_C: 32.0
  }),
  ee.Feature(null, {
    Connectivity: 'Medium',
    Mean_LST_C: 30.5
  }),
  ee.Feature(null, {
    Connectivity: 'High',
    Mean_LST_C: 29.2
  })
]);

print(
  'Final Connectivity-LST Results:',
  finalResults
);
// ==========================================
// Step 117: Low vs High percentage difference
// ==========================================

var lowHighPercentageDifference = ee.Number(32.0)
  .subtract(ee.Number(29.2))
  .divide(ee.Number(29.2))
  .multiply(100);

print(
  'Low vs High LST percentage difference (%):',
  lowHighPercentageDifference
);
// ==========================================
// Step 118: Final portfolio chart
// ==========================================

var portfolioChart = ui.Chart.feature.byFeature({
  features: finalResults,
  xProperty: 'Connectivity',
  yProperties: ['Mean_LST_C']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Vegetation Connectivity and Land Surface Temperature',
  hAxis: {
    title: 'Vegetation Connectivity'
  },
  vAxis: {
    title: 'Mean Land Surface Temperature (°C)'
  },
  legend: {
    position: 'none'
  },
  bar: {
    groupWidth: '60%'
  }
});

print(portfolioChart);
// ==========================================
// Step 119: Final project summary
// ==========================================

var projectSummary = ee.Dictionary({
  Low_connectivity_LST_C: 32.0,
  Medium_connectivity_LST_C: 30.5,
  High_connectivity_LST_C: 29.2,
  Overall_mean_LST_C: 30.57,
  Low_to_High_difference_C: 2.8,
  Low_to_High_reduction_percent: 8.75,
  Average_decrease_per_connectivity_step_C: 1.4,
  Low_vs_High_percentage_difference: 9.6
});

print(
  'FINAL PROJECT SUMMARY:',
  projectSummary
);
// ==========================================
// Step 120: Project interpretation
// ==========================================

print('==========================================');
print('FINAL PROJECT INTERPRETATION');
print('==========================================');

print(
  'Finding 1:',
  'Low vegetation connectivity recorded the highest mean LST of 32.0°C.'
);

print(
  'Finding 2:',
  'Medium vegetation connectivity recorded a mean LST of 30.5°C.'
);

print(
  'Finding 3:',
  'High vegetation connectivity recorded the lowest mean LST of 29.2°C.'
);

print(
  'Finding 4:',
  'The difference between Low and High connectivity was 2.8°C.'
);

print(
  'Finding 5:',
  'This represents an 8.75% reduction in mean LST from Low to High connectivity.'
);

print(
  'Finding 6:',
  'Overall, the results show a negative relationship between vegetation connectivity and land surface temperature.'
);

print(
  'Important note:',
  'The results show an association and do not by themselves prove that vegetation connectivity is the only cause of lower LST.'
);
// ==========================================
// Step 121: Project title
// ==========================================

print('==========================================');
print('LAGOS GEOAI PROJECT');
print('==========================================');

print(
  'Title:',
  'Vegetation Connectivity and Land Surface Temperature in the Lagos Lekki-Ajah Corridor'
);

print(
  'Study approach:',
  'Google Earth Engine, Sentinel-2 remote sensing and spatial analysis'
);
// ==========================================
// Step 122: Project metadata
// ==========================================

var projectMetadata = ee.Dictionary({
  Study_area: 'Lagos Lekki-Ajah Corridor',
  Main_topic: 'Vegetation Connectivity and Land Surface Temperature',
  Platform: 'Google Earth Engine',
  Remote_sensing_data: 'Sentinel-2',
  Analysis_type: 'Spatial and statistical analysis',
  Connectivity_classes: 'Low, Medium, High',
  Main_result: 'Higher vegetation connectivity was associated with lower LST'
});

print(
  'PROJECT METADATA:',
  projectMetadata
);
// ==========================================
// Step 123: Portfolio results table
// ==========================================

var portfolioResults = ee.FeatureCollection([
  ee.Feature(null, {
    Connectivity: 'Low',
    Mean_LST_C: 32.0,
    Interpretation: 'Highest observed LST'
  }),
  ee.Feature(null, {
    Connectivity: 'Medium',
    Mean_LST_C: 30.5,
    Interpretation: 'Intermediate LST'
  }),
  ee.Feature(null, {
    Connectivity: 'High',
    Mean_LST_C: 29.2,
    Interpretation: 'Lowest observed LST'
  })
]);

print(
  'PORTFOLIO RESULTS TABLE:',
  portfolioResults
);
// ==========================================
// Step 124: Final vegetation connectivity map
// ==========================================

Map.centerObject(studyArea, 12);

Map.addLayer(
  connectivityClasses,
  {
    min: 1,
    max: 3,
    palette: ['red', 'yellow', 'green']
  },
  'Vegetation Connectivity - Final'
);

print(
  'Final vegetation connectivity map displayed.'
);
// ==========================================
// Step 125: Final LST map
// ==========================================

Map.addLayer(
  validLST2025,
  {
    min: 20,
    max: 37,
    palette: ['blue', 'cyan', 'yellow', 'orange', 'red']
  },
  'Land Surface Temperature - Final'
);

print(
  'Final LST map displayed.'
);
// ==========================================
// Step 129: Final Results Table
// ==========================================

var finalPortfolioTable = ee.FeatureCollection([
  ee.Feature(null, {
    Connectivity: 'Low',
    Mean_LST_C: 32.0,
    Temperature_Difference_from_High_C: 2.8
  }),

  ee.Feature(null, {
    Connectivity: 'Medium',
    Mean_LST_C: 30.5,
    Temperature_Difference_from_High_C: 1.3
  }),

  ee.Feature(null, {
    Connectivity: 'High',
    Mean_LST_C: 29.2,
    Temperature_Difference_from_High_C: 0.0
  })
]);

print(
  'FINAL PORTFOLIO RESULTS TABLE:',
  finalPortfolioTable
);
// ==========================================
// Step 130: Overall Cooling Trend
// ==========================================

var overallCoolingTrend = ee.Number(32.0)
  .subtract(ee.Number(29.2));

print(
  'Overall cooling from Low to High connectivity (°C):',
  overallCoolingTrend
);

print(
  'Average LST decrease per connectivity level (°C):',
  overallCoolingTrend.divide(2)
);
// ==========================================
// Step 131: Final Project Conclusion
// ==========================================

print('==========================================');
print('FINAL PROJECT CONCLUSION');
print('==========================================');

print(
  'Conclusion:',
  'Higher vegetation connectivity was associated with lower land surface temperature in the Lagos Lekki-Ajah study area.'
);

print(
  'Key result:',
  'Mean LST decreased from 32.0°C in low-connectivity areas to 29.2°C in high-connectivity areas.'
);

print(
  'Overall cooling:',
  '2.8°C from low to high vegetation connectivity.'
);

print(
  'Percentage reduction:',
  '8.75% reduction in mean LST from low to high connectivity.'
);

print(
  'Interpretation:',
  'The results suggest that areas with more connected vegetation may experience cooler land surface conditions.'
);

print(
  'Limitation:',
  'The analysis demonstrates an observed association and does not establish that vegetation connectivity alone causes the temperature differences.'
);
// ==========================================
// Step 132: Project Information Panel
// ==========================================

print('==========================================');
print('LAGOS GEOAI — PROJECT INFORMATION');
print('==========================================');

print(
  'Study Area:',
  'Lagos Lekki-Ajah Corridor'
);

print(
  'Research Topic:',
  'Vegetation Connectivity and Land Surface Temperature'
);

print(
  'Platform:',
  'Google Earth Engine'
);

print(
  'Remote Sensing:',
  'Satellite imagery and spatial analysis'
);

print(
  'Connectivity Classes:',
  'Low, Medium, High'
);

print(
  'Low Connectivity LST:',
  '32.0°C'
);

print(
  'Medium Connectivity LST:',
  '30.5°C'
);

print(
  'High Connectivity LST:',
  '29.2°C'
);

print(
  'Overall Cooling:',
  '2.8°C'
);

print(
  'LST Reduction:',
  '8.75%'
);

print(
  'Main Finding:',
  'Higher vegetation connectivity was associated with lower land surface temperature.'
);
// ==========================================
// Step 133: Vegetation Connectivity Legend
// ==========================================

var connectivityLegend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 12px'
  }
});

connectivityLegend.add(
  ui.Label({
    value: 'Vegetation Connectivity',
    style: {
      fontWeight: 'bold',
      fontSize: '14px',
      margin: '0 0 6px 0'
    }
  })
);

var lowLabel = ui.Label('■  Low Connectivity', {
  color: 'red',
  margin: '2px 0'
});

var mediumLabel = ui.Label('■  Medium Connectivity', {
  color: 'yellow',
  margin: '2px 0'
});

var highLabel = ui.Label('■  High Connectivity', {
  color: 'green',
  margin: '2px 0'
});

connectivityLegend.add(lowLabel);
connectivityLegend.add(mediumLabel);
connectivityLegend.add(highLabel);

Map.add(connectivityLegend);
// ==========================================
// Step 134: LST Legend
// ==========================================

var lstLegend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 12px'
  }
});

lstLegend.add(
  ui.Label({
    value: 'Land Surface Temperature (°C)',
    style: {
      fontWeight: 'bold',
      fontSize: '14px',
      margin: '0 0 6px 0'
    }
  })
);

var lstLow = ui.Label('■  Lower temperature', {
  color: 'blue',
  margin: '2px 0'
});

var lstMid = ui.Label('■  Moderate temperature', {
  color: 'yellow',
  margin: '2px 0'
});

var lstHigh = ui.Label('■  Higher temperature', {
  color: 'red',
  margin: '2px 0'
});

lstLegend.add(lstLow);
lstLegend.add(lstMid);
lstLegend.add(lstHigh);

Map.add(lstLegend);
// ==========================================
// Step 135: Map Title
// ==========================================

var mapTitle = ui.Panel({
  style: {
    position: 'top-center',
    padding: '8px 15px'
  }
});

mapTitle.add(
  ui.Label({
    value: 'Vegetation Connectivity and Land Surface Temperature',
    style: {
      fontWeight: 'bold',
      fontSize: '16px',
      margin: '0'
    }
  })
);

Map.add(mapTitle);
Export.image.toDrive({
  image: connectivityClasses,
  description: 'Lagos_Vegetation_Connectivity_2025',
  folder: 'Lagos_GeoAI',
  fileNamePrefix: 'Vegetation_Connectivity_2025',
  region: studyArea,
  scale: 10,
  maxPixels: 1e13
});
Export.image.toDrive({
  image: validLST2025,
  description: 'Lagos_Land_Surface_Temperature_2025',
  folder: 'Lagos_GeoAI',
  fileNamePrefix: 'LST_2025',
  region: studyArea,
  scale: 30,
  maxPixels: 1e13
});