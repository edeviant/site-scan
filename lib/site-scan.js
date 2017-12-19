
// Modules
const puppeteer   = require('puppeteer');
const chalk       = require('chalk');
const _           = require('underscore');

// Local
const pkg       = require('../node_modules/site-scan/package.json');
// const help      = require('../node_modules/site-scan/help-message');
const options   = require('../node_modules/site-scan/lib/options.js');

// Loop through each definition
options.definitions.forEach(definition => {
  // Loop through each field
  definition.fields.some(field => {
    // Remove the hyphens from the field
    let fixedField = field.replace(/-/g, '');
  });
});

var exports = module.exports = {

  // Take screenshots
  shoot: async function(urls, opts, cb) {

    // merge options
    _.each(_.keys(opts), function(key) {
      options[key] = opts[key];
    });

    console.log(chalk`{yellow • Launching chrome...}`);

    let browser, page;

    try {
      // Launch chrome
      browser = await puppeteer.launch();

      // Create a new page
      page = await browser.newPage();

      // Set the viewport
      await page.setViewport({
        width: options.width,
        height: options.height
      });
    } catch(e) {
      console.log(chalk`{red Error launching chrome:}`);
      throw e;
    }

    console.log(chalk`{green ✔ Done.}`);

    // Screenshot each website provided
    for (let i = 0; i < urls.length; i++) {
      // Insert new line
      console.log('');

      // Create a proper filename
      let fileName;
      if (options.name && options.name.length > 0) {
        fileName = options.name;

        if (urls[i].length > 1) {
          fileName += '_' + urls[i];
        }
      }

      try {
        // Take the pic
        await takeScreenshot(urls[i], page, fileName);
      } catch(e) {
        console.log(e);
      }
    }

    // Close the browser
    await browser.close();

    console.log('done');
    console.log(chalk`{green ✔ Done. Have a great day!}`);

    cb();
  }
};

/**
 * Takes a screenshot of the site at the URL provided
 * @param {string} url Website URL to screenshot
 * @param {*} page Puppeteer page
 * @param {string} fileName Screenshot file name
 */
async function takeScreenshot(url, page, fileName) {
  if (typeof url !== 'string') {
    return;
  }

  // Ensure there's a scheme on the URL
  if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
    url = `http://${url}`;
  }

  console.log(chalk`{yellow • Loading ${url}...}`);

  // Navigate to the url
  try {
    await page.goto(url);
  } catch(e) {
    console.log(chalk`{red • Error loading ${url}}`);
    throw e;
  }

  // Get location host
  let host = await page.evaluate(() => Promise.resolve(window.location.host));

  // Use default file name if no name was provided
  if (!fileName || fileName.length < 1) {
    fileName = sanitizeFilename(host);
    fileName = sanitizeFilename(url);
  }

  // Sleep
  if (options.sleep > 0) {
    console.log(chalk`{yellow • Sleeping for ${options.sleep}ms...}`);
    await new Promise(res => {
      setTimeout(() => res(), options.sleep);
    });
  }

  console.log(chalk`{yellow • Taking screenshot of ${url}...}`);

  // Take the screen shot
  try {
    await page.screenshot({
      path: `${options.path}${fileName}.png`,
      fullPage: options.full,
      omitBackground: options.transparent,
      type: options.jpeg ? 'jpeg' : 'png',
      quality: options.quality
    });  
  } catch(e) {
    console.log(chalk`{red • Error taking screenshot of ${url}}`);
    throw e;
  }

  console.log(chalk`{green ✔ Screenshot saved to ${fileName}.png}`);
}

/**
 * Cleans a URL to be used as a filename
 * @param {string} url Website URL to clean
 */
function sanitizeFilename(url) {
  // Remove scheme
  let fileName = url
    .replace(/http:\/\//g, '')
    .replace(/https:\/\//g, '')
    .replace(/\//g, '-');

  // Remove final slash
  if (fileName[fileName.length - 1] === '/') {
    fileName = fileName.substring(0, fileName.length - 1);
  }

  return fileName;
}

