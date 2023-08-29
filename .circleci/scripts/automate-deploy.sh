# install dependencies and upload cartridges and metadata
echo Fetching latest master
currentBranch=$(git branch --show-current)
cd ../../
git checkout master
git pull
git checkout $currentBranch

echo Upload cartridge and metadata....
echo Installing dependencies
npm install
echo Compiling + Transpiling cartridges
npm run build
npm run compilePPC

echo Uploading cartridges
npm run upload:all

echo Uploading Metadata
npm run uploadMetadata