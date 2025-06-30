export interface PortfolioItemData {
  id: number;
  title: string;
  type: string;
  coverImage: string;
  sourceUrl?: string;
  date?: string;
  location?: string;
  gpsCoords?: string;
  feat?: string;
  description?: string;
  easterEgg?: string;
}

export function parseCSVToPortfolioItems(csvText: string): PortfolioItemData[] {
  console.log("Attempting to parse CSV data. Raw CSV text received (first 500 chars):", csvText.substring(0, 500));
  const lines = csvText.trim().split(/\r\n|\n/);

  if (lines.length === 0) {
    console.error("CSV Parsing Error: No lines found in CSV data.");
    throw new Error("CSV data is empty or malformed (no lines).");
  }
  if (lines.length === 1) {
    console.warn("CSV Parsing Warning: Only one line found in CSV data. A header row and at least one data row are expected. Line content:", lines[0]);
    if (lines[0].includes(',') && lines[0].trim() !== "") {
        console.error("CSV Parsing Error: Only one line found, and it appears to be a data row. A header row is required.");
        throw new Error("CSV data must contain a header row. Only a single data-like line was found.");
    } else {
        console.warn("CSV Parsing Warning: Single line found does not appear to be a valid data row, and no header is present. Effectively no data.");
        return [];
    }
  }

  const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''));
  console.log("Parsed CSV Headers:", headers);
  const portfolioItems: PortfolioItemData[] = [];

  const idIndex = headers.indexOf('id');
  const titleIndex = headers.indexOf('title');
  const typeIndex = headers.indexOf('type');
  const coverImageIndex = headers.indexOf('coverImage');
  const sourceUrlIndex = headers.indexOf('sourceUrl');
  const dateIndex = headers.indexOf('date');
  const locationIndex = headers.indexOf('location');
  const gpsCoordsIndex = headers.indexOf('gpsCoords');
  const featIndex = headers.indexOf('feat');
  const descriptionIndex = headers.indexOf('description');
  const easterEggIndex = headers.indexOf('easterEgg');

  if (idIndex === -1 || titleIndex === -1 || typeIndex === -1 || coverImageIndex === -1) {
    console.error(`CSV Header Error: Missing one or more required columns. Found headers: [${headers.join(', ')}]. Required: id, title, type, coverImage.`);
    throw new Error('CSV headers are missing one or more required columns: id, title, type, coverImage. Check console for found headers.');
  }

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const originalLineContent = lines[lineIdx];
    const lineContent = originalLineContent.trim();
    if (!lineContent) {
        console.warn(`Skipping empty CSV line at sheet row ${lineIdx + 1}.`);
        continue;
    }

    const values: string[] = [];
    let currentPosition = 0;
    while (currentPosition < lineContent.length) {
        let value = "";
        let inQuotes = false;

        if (lineContent[currentPosition] === '"') {
            inQuotes = true;
            currentPosition++;
            let charBuffer = "";
            while (currentPosition < lineContent.length) {
                if (lineContent[currentPosition] === '"') {
                    if (currentPosition + 1 < lineContent.length && lineContent[currentPosition + 1] === '"') {
                        charBuffer += '"';
                        currentPosition += 2;
                    } else {
                        currentPosition++;
                        inQuotes = false;
                        break;
                    }
                } else {
                    charBuffer += lineContent[currentPosition];
                    currentPosition++;
                }
            }
            value = charBuffer;
            if (inQuotes) {
                console.warn(`Malformed CSV: Unclosed quoted field on line ${lineIdx + 1}. Original line: "${originalLineContent}". Partial value: "${value}"`);
            }
        } else {
            let charBuffer = "";
            const commaIndex = lineContent.indexOf(',', currentPosition);
            if (commaIndex === -1) {
                charBuffer = lineContent.substring(currentPosition);
                currentPosition = lineContent.length;
            } else {
                charBuffer = lineContent.substring(currentPosition, commaIndex);
                currentPosition = commaIndex;
            }
            value = charBuffer;
        }

        values.push(value.trim());

        if (currentPosition < lineContent.length && lineContent[currentPosition] === ',') {
            currentPosition++;
            if (currentPosition === lineContent.length) {
                values.push('');
            }
        } else if (currentPosition === lineContent.length) {
            break;
        }
    }
    const processedValues = values;

    if (processedValues.length === 0 && lineContent.length > 0) {
      console.warn(`Skipping line at sheet row ${lineIdx + 1} as it was parsed into zero values despite having content. Original line: "${originalLineContent}"`);
      continue;
    }

    const idString = idIndex < processedValues.length ? processedValues[idIndex] : undefined;
     if (idString === undefined || idString === null || idString.trim() === "") {
        console.warn(`Skipping line at sheet row ${lineIdx + 1} due to missing or empty ID. Processed values: [${processedValues.map(v => `"${v}"`).join(', ')}]. Original line: "${originalLineContent}"`);
        continue;
    }
    const id = parseInt(idString, 10);

    if (isNaN(id)) {
        console.warn(`Skipping line at sheet row ${lineIdx + 1} due to invalid or non-numeric ID. Attempted to parse: "${idString}". Processed values: [${processedValues.map(v => `"${v}"`).join(', ')}]. Original line: "${originalLineContent}"`);
        continue;
    }

    const title = titleIndex < processedValues.length && processedValues[titleIndex] ? processedValues[titleIndex] : 'Untitled';
    const type = typeIndex < processedValues.length && processedValues[typeIndex] ? processedValues[typeIndex].toLowerCase() : 'image';

    let actualCoverImage = coverImageIndex < processedValues.length ? (processedValues[coverImageIndex]?.trim() || '') : '';
    const sourceUrl = sourceUrlIndex !== -1 && sourceUrlIndex < processedValues.length ? (processedValues[sourceUrlIndex]?.trim() || undefined) : undefined;

    if (!actualCoverImage && sourceUrl) {
        console.log(`Row ${lineIdx + 1} (ID: ${id}): coverImage is empty, using sourceUrl ("${sourceUrl}") as fallback for cover image.`);
        actualCoverImage = sourceUrl;
    }

    if (!actualCoverImage) {
        console.warn(`Skipping line at sheet row ${lineIdx + 1} (ID: ${id}) due to missing or empty coverImage (and no usable sourceUrl fallback). Processed values: [${processedValues.map(v => `"${v}"`).join(', ')}]. Original line: "${originalLineContent}"`);
        continue;
    }

    if (!title.trim() && title !== 'Untitled') {
        console.warn(`Item with ID ${id} (sheet row ${lineIdx + 1}) has an empty or whitespace-only title. It will be displayed as 'Untitled'. Original line: "${originalLineContent}"`);
    }

    const itemData: PortfolioItemData = {
      id: id,
      title: title,
      type: type,
      coverImage: actualCoverImage,
      sourceUrl: sourceUrl,
      date: dateIndex !== -1 && dateIndex < processedValues.length ? (processedValues[dateIndex]?.trim() || undefined) : undefined,
      location: locationIndex !== -1 && locationIndex < processedValues.length ? (processedValues[locationIndex]?.trim() || undefined) : undefined,
      gpsCoords: gpsCoordsIndex !== -1 && gpsCoordsIndex < processedValues.length ? (processedValues[gpsCoordsIndex]?.trim() || undefined) : undefined,
      feat: featIndex !== -1 && featIndex < processedValues.length ? (processedValues[featIndex] || undefined) : undefined,
      description: descriptionIndex !== -1 && descriptionIndex < processedValues.length ? (processedValues[descriptionIndex] || undefined) : undefined,
      easterEgg: easterEggIndex !== -1 && easterEggIndex < processedValues.length ? (processedValues[easterEggIndex] || undefined) : undefined,
    };
    portfolioItems.push(itemData);
  }
  console.log("Successfully parsed portfolio items:", portfolioItems);
  return portfolioItems;
}

export function parsePortfolioDate(dateString?: string): Date | null {
  if (!dateString) return null;

  const parts = dateString.split('/');
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && year > 1000 && year < 3000) {
      return new Date(year, month - 1, 1);
    }
  }

  const standardDate = new Date(dateString);
  if (!isNaN(standardDate.getTime())) {
    return standardDate;
  }

  return null;
}
