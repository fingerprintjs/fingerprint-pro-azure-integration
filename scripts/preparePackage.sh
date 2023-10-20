cd dist
zip -r package.zip *
mv package.zip ../
cd ../
cp package.zip v$1.zip
