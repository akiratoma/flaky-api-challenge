const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv)).help(false).argv;
const URI = 'http://app-homevision-staging.herokuapp.com/api_project/houses';

const downloadImage = async (url, filename) => {
  const filepath = path.resolve(__dirname, 'files', filename);
  const writer = fs.createWriteStream(filepath);
  const response = await axios.get(url, { responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

const fetchPage = async (page, retries) => {
  for (let c = 0; c < retries + 1; c++) {
    try {
      const { data: { houses } } = await axios.get(URI, { params: { page } });
      await Promise.all(houses.map(house => {
        const uri = house.photoURL;
        const ext = uri.match(/\.(\w+)$/g);
        const filename = `id-${house.id}-${house.address}${ext[0]}`;
        return downloadImage(uri, filename);
      }));
      console.log(`Successfully fetched page ${page}`);
      return;
    } catch (_err) {
      if (c < retries) {
        console.log(`Error fetching page ${page} (Try: ${c + 1}). Retrying...`);
      } else {
        console.log(`Error fetching page ${page}`);
        return;
      };
    };
  };
};

const usage = () => {
  console.log('Usage: node index.js <page>');
  console.log('Usage: node index.js <start-page> <end-page>');
  console.log('');
  console.log('Options:')
  console.log('  --retries=RETRIES\tNumber of fetching retries before throwing error. Defaults to 1.');
  process.exit(0);
};

const invalidUsage = (message = 'Invalid usage.') => {
  console.log(`${message} See: node index.js --help`);
  process.exit(1);
};

const checkDirectory = () => {
  return new Promise((resolve, reject) => {
    const dirpath = path.resolve(__dirname, 'files');
    fs.access(dirpath, err => {
      if (err) {
        fs.mkdir(dirpath, err => {
          if (err) {
            reject('Error creating files directory.');
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      };
    });
  });
};

const main = async () => {
  try {
    await checkDirectory();
  } catch (err) {
    console.log(err);
    process.exit(1);
  };
  const { _: args, help, retries } = argv;
  if (help) {
    usage();
  };
  if (args.length === 0 || args.length > 2) {
    invalidUsage();
  };
  if (retries && isNaN(retries)) {
    invalidUsage('RETRIES must be a number.');
  };
  const re = retries ? retries : 1;
  switch (args.length) {
    case 1:
      const [page] = args;
      if (isNaN(page)) {
        invalidUsage('<page> must be a number.');
      };
      await fetchPage(page, re);
      break;
    case 2:
      const [start, end] = args;
      if (isNaN(start) || isNaN(end)) {
        invalidUsage('<start-page> and <end-page> must be numbers.');
      };
      if (end < start) {
        invalidUsage('<end-page> must be greater than or equal to <start-page>.');
      };
      const pagesList = Array.from({ length: (end - start) + 1 }, (_, i) => start + i);
      await Promise.all(pagesList.map(async (page) => {
        return await fetchPage(page, re);
      }));
      break;
    default:
      invalidUsage();
  };
};

main();
