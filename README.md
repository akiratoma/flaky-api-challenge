# FLAKY API CHALLENGE

Install dependencies:
```
npm install
```

Fetch a single page: (e.g. fetch page 1)
```
node index.js 1
```

Fetch multiple pages: (e.g. fetch from page 3 to page 5)
```
node index.js 3 5
```

Optionally, define number of retries: (e.g. 3 retries before throwing error)
```
node index.js 3 5 --retries=3
```

See help:
```
node index.js --help
```
