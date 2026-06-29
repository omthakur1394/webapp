const fs = require('fs');
const path = require('path');

// Helper to parse a CSV line, respecting double quotes
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Strip HTML tags from description
function cleanHtml(text) {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Run the script
function run() {
  const productsJsonPath = path.join(__dirname, '..', 'app', 'data', 'products.json');
  
  // Load existing products to preserve them
  let existingProducts = [];
  try {
    if (fs.existsSync(productsJsonPath)) {
      existingProducts = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
      console.log(`Loaded ${existingProducts.length} existing products to preserve.`);
      // Only keep the 5 core original test products to prevent duplicate loops on subsequent runs
      existingProducts = existingProducts.slice(0, 5);
      console.log(`Kept ${existingProducts.length} core original products.`);
    }
  } catch (err) {
    console.error('Failed to load existing products:', err);
  }

  const existingIds = new Set(existingProducts.map(p => p.id));
  const newProducts = [...existingProducts];

  // Category counts to trace the dataset
  const categoryCounts = {
    Electronics: existingProducts.filter(p => p.category === 'Electronics').length,
    Networking: existingProducts.filter(p => p.category === 'Networking').length,
    Accessories: existingProducts.filter(p => p.category === 'Accessories').length,
    Fashion: existingProducts.filter(p => p.category === 'Fashion').length,
    Laptops: existingProducts.filter(p => p.category === 'Laptops').length,
    Monitors: 0,
    'Keyboards & Mice': 0,
    'PC Components': 0,
  };

  const dataDir = 'C:\\Users\\ASUS\\Desktop\\webapp\\data';

  // Helper to read and split file
  function readCSVLines(filename) {
    const fullPath = path.join(dataDir, filename);
    if (!fs.existsSync(fullPath)) {
      console.log(`${filename} not found.`);
      return [];
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    return content.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  }

  // 1. Parse amazon.csv
  const amazonLines = readCSVLines('amazon.csv');
  if (amazonLines.length > 1) {
    console.log('Parsing amazon.csv...');
    for (let i = 1; i < amazonLines.length; i++) {
      const row = parseCSVLine(amazonLines[i]);
      if (row.length < 12) continue;

      const id = row[0].trim();
      if (!id || existingIds.has(id)) continue;

      const name = row[1].trim();
      const catStr = row[2].trim().toLowerCase();
      const discPriceStr = row[3].replace(/[^\d.]/g, '').trim();
      const discPrice = parseFloat(discPriceStr) || 0;
      const about = cleanHtml(row[8]);
      const imgLink = row[11].trim();

      if (!name || !imgLink || discPrice === 0) continue;

      // Determine category with precedence checks
      let category = 'Accessories';
      if (
        catStr.includes('networking') || 
        catStr.includes('networkingdevices') || 
        catStr.includes('networkadapters') || 
        catStr.includes('router') || 
        catStr.includes('wifi') || 
        catStr.includes('wireless') || 
        catStr.includes('dongle') ||
        catStr.includes('modem')
      ) {
        category = 'Networking';
      } else if (
        catStr.includes('smartphones') || 
        catStr.includes('basicmobiles') || 
        catStr.includes('televisions') || 
        catStr.includes('smarttelevisions') || 
        catStr.includes('headphones') || 
        catStr.includes('earbuds') ||
        catStr.includes('smartwatches') || 
        catStr.includes('projectors') || 
        catStr.includes('speakers') ||
        catStr.includes('hometheater') ||
        catStr.includes('homeaudio') ||
        catStr.includes('streamingdevices') ||
        catStr.includes('receivers')
      ) {
        category = 'Electronics';
      } else if (
        catStr.includes('cable') || 
        catStr.includes('accessory') || 
        catStr.includes('accessories') || 
        catStr.includes('peripherals') || 
        catStr.includes('cables') ||
        catStr.includes('chargers') ||
        catStr.includes('powerbanks') ||
        catStr.includes('adapters') ||
        catStr.includes('tripods') ||
        catStr.includes('selfiesticks') ||
        catStr.includes('mounts') ||
        catStr.includes('stands') ||
        catStr.includes('screenprotectors') ||
        catStr.includes('styluspens') ||
        catStr.includes('cases')
      ) {
        category = 'Accessories';
      } else {
        if (catStr.includes('computers') || catStr.includes('accessories')) {
          category = 'Accessories';
        } else {
          category = 'Electronics';
        }
      }

      const brand = name.split(' ')[0] || 'Generic';

      const product = {
        id,
        name,
        category,
        price: discPrice,
        description: about.substring(0, 200) + (about.length > 200 ? '...' : ''),
        image_url: imgLink,
        specs: {
          brand,
          rating: row[6] ? row[6].trim() : '4.0',
          reviews: row[7] ? row[7].trim() : '100+'
        }
      };

      newProducts.push(product);
      existingIds.add(id);
      categoryCounts[category]++;
    }
  }

  // 2. Parse Fashion Dataset.csv (limiting to 2000 items)
  const fashionLines = readCSVLines('Fashion Dataset.csv');
  const FASHION_LIMIT = 2000;
  if (fashionLines.length > 1) {
    console.log('Parsing Fashion Dataset.csv...');
    for (let i = 1; i < fashionLines.length; i++) {
      const row = parseCSVLine(fashionLines[i]);
      if (row.length < 9) continue;

      const id = row[0].trim();
      if (!id || existingIds.has(id)) continue;

      const name = row[1].trim();
      const priceStr = row[2].replace(/[^\d.]/g, '').trim();
      const price = parseFloat(priceStr) || 0;
      const colour = row[3].trim();
      const brand = row[4].trim();
      const imgLink = row[5].trim();
      const desc = cleanHtml(row[8]);

      if (!name || !imgLink || price === 0) continue;

      const category = 'Fashion';
      if (categoryCounts[category] >= FASHION_LIMIT) continue;

      const product = {
        id,
        name,
        category,
        price,
        description: desc.substring(0, 200) + (desc.length > 200 ? '...' : ''),
        image_url: imgLink,
        specs: {
          brand: brand || 'Generic',
          color: colour || 'Multi',
          wash_care: name.toLowerCase().includes('cotton') ? 'Hand wash' : 'Machine wash'
        }
      };

      newProducts.push(product);
      existingIds.add(id);
      categoryCounts[category]++;
    }
  }

  // 3. Parse laptops.csv (converted USD -> INR exchange rate 84)
  const laptopLines = readCSVLines('laptops.csv');
  if (laptopLines.length > 1) {
    console.log('Parsing laptops.csv...');
    const laptopImages = [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80', // gaming
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80', // macbook
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80', // thinkpad
      'https://images.unsplash.com/photo-1496181130204-7552cc14ac1a?auto=format&fit=crop&w=600&q=80', // dell
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80'  // generic
    ];

    for (let i = 1; i < laptopLines.length; i++) {
      const row = parseCSVLine(laptopLines[i]);
      if (row.length < 15) continue;

      const id = row[0].trim();
      if (!id || existingIds.has(id)) continue;

      const brand = row[1].trim();
      const model = row[2].trim();
      const name = `${brand} ${model}`;
      const priceUsd = parseFloat(row[14]) || 0;
      const priceInr = Math.round(priceUsd * 84);
      
      const cpu = row[3].trim();
      const gpu = row[4].trim();
      const ram = `${row[5].trim()}GB ${row[6].trim()}`;
      const storage = row[7].trim();
      const display = row[8].trim();
      const os = row[13].trim();
      const subCategory = row[16] ? row[16].trim() : 'Laptop';

      let imgLink = laptopImages[i % laptopImages.length];
      const lowerBrand = brand.toLowerCase();
      if (lowerBrand.includes('apple') || lowerBrand.includes('macbook')) {
        imgLink = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80';
      } else if (subCategory.toLowerCase().includes('gaming')) {
        imgLink = 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80';
      } else if (lowerBrand.includes('thinkpad') || lowerBrand.includes('lenovo')) {
        imgLink = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80';
      }

      const description = `${model} ${subCategory} laptop with ${cpu}, ${gpu}, ${ram} RAM, ${storage} storage, running ${os}.`;

      const product = {
        id,
        name,
        category: 'Laptops',
        price: priceInr,
        description,
        image_url: imgLink,
        specs: { brand, cpu, gpu, ram, storage, display }
      };

      newProducts.push(product);
      existingIds.add(id);
      categoryCounts['Laptops']++;
    }
  }

  // 4. Parse monitor.csv
  const monitorLines = readCSVLines('monitor.csv');
  if (monitorLines.length > 1) {
    console.log('Parsing monitor.csv...');
    const monitorImages = [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1547119957-637f8679db1e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=600&q=80'
    ];
    for (let i = 1; i < monitorLines.length; i++) {
      const row = parseCSVLine(monitorLines[i]);
      if (row.length < 8) continue;
      const id = row[0].trim();
      if (!id || existingIds.has(id)) continue;

      const brand = row[1].trim();
      const model = row[2].trim();
      const name = `${brand} ${model} Display Monitor`;
      const size = row[3].trim();
      const res = row[4].trim();
      const refresh = row[5].trim();
      const panel = row[6].trim();
      const price = parseFloat(row[7]) || 0;

      const product = {
        id,
        name,
        category: 'Monitors',
        price,
        description: `${brand} ${model} desktop monitor. Screen: ${size}-inch, Resolution: ${res}, Refresh rate: ${refresh}Hz, Panel: ${panel}.`,
        image_url: monitorImages[i % monitorImages.length],
        specs: { brand, display_size: `${size} inch`, resolution: res, refresh_rate: `${refresh}Hz`, panel_type: panel }
      };
      newProducts.push(product);
      existingIds.add(id);
      categoryCounts['Monitors']++;
    }
  }

  // 5. Parse keyboard.csv
  const keyboardLines = readCSVLines('keyboard.csv');
  if (keyboardLines.length > 1) {
    console.log('Parsing keyboard.csv...');
    const keyboardImages = [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80'
    ];
    for (let i = 1; i < keyboardLines.length; i++) {
      const row = parseCSVLine(keyboardLines[i]);
      if (row.length < 7) continue;
      const id = row[0].trim();
      if (!id || existingIds.has(id)) continue;

      const brand = row[1].trim();
      const model = row[2].trim();
      const switchType = row[3].trim();
      const backlight = row[4].trim();
      const conn = row[5].trim();
      const price = parseFloat(row[6]) || 0;

      const product = {
        id,
        name: `${brand} ${model} Mechanical Keyboard`,
        category: 'Keyboards & Mice',
        price,
        description: `${brand} ${model} mechanical keyboard featuring ${switchType} switches, ${backlight} backlight, and ${conn} connection.`,
        image_url: keyboardImages[i % keyboardImages.length],
        specs: { brand, switch_type: switchType, backlight, connection: conn }
      };
      newProducts.push(product);
      existingIds.add(id);
      categoryCounts['Keyboards & Mice']++;
    }
  }

  // 6. Parse mouse.csv
  const mouseLines = readCSVLines('mouse.csv');
  if (mouseLines.length > 1) {
    console.log('Parsing mouse.csv...');
    const mouseImages = [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1613141411244-0e4ac259d217?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1625842268584-8f3290404019?auto=format&fit=crop&w=600&q=80'
    ];
    for (let i = 1; i < mouseLines.length; i++) {
      const row = parseCSVLine(mouseLines[i]);
      if (row.length < 7) continue;
      const id = row[0].trim();
      if (!id || existingIds.has(id)) continue;

      const brand = row[1].trim();
      const model = row[2].trim();
      const sensor = row[3].trim();
      const dpi = row[4].trim();
      const backlight = row[5].trim();
      const conn = row[6].trim();
      const price = parseFloat(row[7]) || 0;

      const product = {
        id,
        name: `${brand} ${model} Wired/Wireless Mouse`,
        category: 'Keyboards & Mice',
        price,
        description: `${brand} ${model} high precision mouse. Features ${sensor} sensor, up to ${dpi} DPI, ${backlight} lighting, and ${conn} interface.`,
        image_url: mouseImages[i % mouseImages.length],
        specs: { brand, sensor_type: sensor, max_dpi: dpi, connection: conn }
      };
      newProducts.push(product);
      existingIds.add(id);
      categoryCounts['Keyboards & Mice']++;
    }
  }

  // Helper to parse components CSVs supporting image array cycling
  function parseComponentCSV(filename, subType, images, specsParser) {
    const lines = readCSVLines(filename);
    if (lines.length <= 1) return;
    console.log(`Parsing ${filename}...`);
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length < 3) continue;

      const id = row[0].trim();
      if (!id || existingIds.has(id)) continue;

      const parsed = specsParser(row);
      if (!parsed) continue;

      const image_url = Array.isArray(images) ? images[i % images.length] : images;

      const product = {
        id,
        name: parsed.name,
        category: 'PC Components',
        price: parsed.price,
        description: parsed.description,
        image_url: image_url,
        specs: parsed.specs
      };
      newProducts.push(product);
      existingIds.add(id);
      categoryCounts['PC Components']++;
    }
  }

  // Define component image arrays for dynamic cycling
  const cabinetImages = [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1626218174358-7769486c4b79?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80'
  ];

  const coolerImages = [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1600541519468-4a9121dc0096?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  ];

  const cpuImages = [
    'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  ];

  const gpuImages = [
    'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?auto=format&fit=crop&w=600&q=80'
  ];

  const motherboardImages = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1551645121-d1034da75057?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=600&q=80'
  ];

  const psuImages = [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80'
  ];

  const ramImages = [
    'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1601737498725-728b7ca746d8?auto=format&fit=crop&w=600&q=80'
  ];

  const storageImages = [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=600&q=80'
  ];

  // 7. Cabinet
  parseComponentCSV('cabinet.csv', 'Cabinet', cabinetImages, (row) => {
    if (row.length < 7) return null;
    const brand = row[1].trim();
    const model = row[2].trim();
    const support = row[3].trim();
    const fans = row[4].trim();
    const side = row[5].trim();
    const price = parseFloat(row[6]) || 0;
    return {
      name: `${brand} ${model} Computer Cabinet Case`,
      price,
      description: `${brand} ${model} premium desktop case supporting ${support} form factor. Includes ${fans} fans and a ${side} side panel.`,
      specs: { brand, support, fans, side_panel: side }
    };
  });

  // 8. Cooler
  parseComponentCSV('cooler.csv', 'Cooler', coolerImages, (row) => {
    if (row.length < 6) return null;
    const brand = row[1].trim();
    const model = row[2].trim();
    const type = row[3].trim();
    const sockets = row[4].trim();
    const price = parseFloat(row[5]) || 0;
    return {
      name: `${brand} ${model} CPU Cooler`,
      price,
      description: `${brand} ${model} desktop processor cooler. Cooling type: ${type}. Supports CPU sockets: ${sockets}.`,
      specs: { brand, cooling_type: type, sockets_supported: sockets }
    };
  });

  // 9. CPU
  parseComponentCSV('cpu.csv', 'CPU', cpuImages, (row) => {
    if (row.length < 10) return null;
    const brand = row[1].trim();
    const model = row[2].trim();
    const cores = row[3].trim();
    const clock = row[4].trim();
    const igpu = row[5].trim();
    const socket = row[6].trim();
    const ram = row[7].trim();
    const tdp = row[8].trim();
    const price = parseFloat(row[9]) || 0;
    return {
      name: `${brand} ${model} Desktop CPU Processor`,
      price,
      description: `${brand} ${model} desktop processor with ${cores} cores/threads, boost speed up to ${clock}, running on ${socket} socket, TDP ${tdp}W.`,
      specs: { brand, cores_threads: cores, boost_clock: clock, integrated_gpu: igpu, socket, ram_supported: ram, tdp: `${tdp}W` }
    };
  });

  // 10. GPU
  parseComponentCSV('gpu.csv', 'GPU', gpuImages, (row) => {
    if (row.length < 8) return null;
    const brand = row[1].trim();
    const model = row[2].trim();
    const vram = row[3].trim();
    const rt = row[4].trim();
    const conn = row[5].trim();
    const tdp = row[6].trim();
    const price = parseFloat(row[7]) || 0;
    return {
      name: `${brand} ${model} Graphics Card`,
      price,
      description: `${brand} ${model} high-performance graphics card. VRAM: ${vram}GB, Ray tracing: ${rt}, TDP: ${tdp}W.`,
      specs: { brand, vram: `${vram}GB`, ray_tracing: rt, power_connector: conn, tdp: `${tdp}W` }
    };
  });

  // 11. Motherboard
  parseComponentCSV('motherboard.csv', 'Motherboard', motherboardImages, (row) => {
    if (row.length < 8) return null;
    const brand = row[1].trim();
    const model = row[2].trim();
    const form = row[3].trim();
    const socket = row[4].trim();
    const ramType = row[5].trim();
    const slots = row[6].trim();
    const price = parseFloat(row[7]) || 0;
    return {
      name: `${brand} ${model} Desktop Motherboard`,
      price,
      description: `${brand} ${model} motherboard in ${form} form factor. Socket: ${socket}, RAM type supported: ${ramType}, Max RAM slots: ${slots}.`,
      specs: { brand, form_factor: form, socket, ram_type: ramType, max_ram_slots: slots }
    };
  });

  // 12. PSU
  parseComponentCSV('psu.csv', 'PSU', psuImages, (row) => {
    if (row.length < 7) return null;
    const brand = row[1].trim();
    const model = row[2].trim();
    const watts = row[3].trim();
    const efficiency = row[4].trim();
    const modular = row[5].trim();
    const price = parseFloat(row[6]) || 0;
    return {
      name: `${brand} ${model} Power Supply Unit (PSU)`,
      price,
      description: `${brand} ${model} power supply rated at ${watts}W. Certification: ${efficiency}, Modularity: ${modular}.`,
      specs: { brand, wattage: `${watts}W`, efficiency, modular }
    };
  });

  // 13. RAM
  parseComponentCSV('ram.csv', 'RAM', ramImages, (row) => {
    if (row.length < 7) return null;
    const brand = row[1].trim();
    const model = row[2].trim();
    const cap = row[3].trim();
    const type = row[4].trim();
    const speed = row[5].trim();
    const price = parseFloat(row[6]) || 0;
    return {
      name: `${brand} ${model} Desktop RAM Module`,
      price,
      description: `${brand} ${model} memory stick. Capacity: ${cap}GB, Memory type: ${type}, Speed: ${speed}MHz.`,
      specs: { brand, capacity: `${cap}GB`, type, speed: `${speed}MHz` }
    };
  });

  // 14. Storage
  parseComponentCSV('storage.csv', 'Storage', storageImages, (row) => {
    if (row.length < 7) return null;
    const brand = row[1].trim();
    const model = row[2].trim();
    const cap = row[3].trim();
    const type = row[4].trim();
    const iface = row[5].trim();
    const price = parseFloat(row[6]) || 0;
    return {
      name: `${brand} ${model} Solid State Drive (SSD)`,
      price,
      description: `${brand} ${model} high speed storage. Capacity: ${cap}GB, Drive type: ${type}, Interface: ${iface}.`,
      specs: { brand, capacity: `${cap}GB`, type, interface: iface }
    };
  });

  console.log('Finished parsing database files.');
  console.log('Final Category Counts:', categoryCounts);
  console.log(`Writing ${newProducts.length} total products to products.json...`);

  fs.writeFileSync(productsJsonPath, JSON.stringify(newProducts, null, 2), 'utf8');
  console.log('Success!');
}

run();
