const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, 'build');
const indexHtmlPath = path.join(buildDir, 'index.html');
const outPath = path.join(__dirname, '..', '..', 'VizLearner_Standalone.html');

let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Inline CSS
const cssMatch = html.match(/<link href="\/static\/css\/(.*?).css" rel="stylesheet">/g);
if (cssMatch) {
    for (const match of cssMatch) {
        const cssPathMatch = match.match(/href="(\/static\/css\/.*?\.css)"/);
        if (cssPathMatch) {
            const cssPath = path.join(buildDir, cssPathMatch[1]);
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            html = html.split(match).join(`<style>${cssContent}</style>`);
        }
    }
}

// Inline JS
const jsMatch = html.match(/<script defer="defer" src="\/static\/js\/(.*?).js"><\/script>/g);
if (jsMatch) {
    for (const match of jsMatch) {
        const jsPathMatch = match.match(/src="(\/static\/js\/.*?\.js)"/);
        if (jsPathMatch) {
            const jsPath = path.join(buildDir, jsPathMatch[1]);
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            const safeJsContent = jsContent.replace(/<\/script>/g, '<\\/script>');
            
            // Remove the original script tag
            html = html.split(match).join('');
            
            // Append the inline script at the end of the body
            html = html.split('</body>').join(`<script>${safeJsContent}</script></body>`);
        }
    }
}

// Write the single HTML file
fs.writeFileSync(outPath, html);
console.log('Successfully created standalone HTML file at ' + outPath);
