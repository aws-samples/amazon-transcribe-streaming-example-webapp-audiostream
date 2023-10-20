## Amazon Transcribe Streaming SDK example Web Application 

To get started, 
1. Clone this repo to a local dev environment 
2. Setup Cognito (User pool, identity pool, client id) (and setup a login user).  
Update `env.local` file with cognito configuration
```
VITE_REACT_APP_USER_POOL_ID=xxxxxx
VITE_REACT_APP_USER_POOL_CLIENT_ID=xxxxxx
VITE_REACT_APP_IDENTITY_POOL_ID=xxxxxxx
VITE_REACT_APP_AWS_REGION=us-east-1
```
3. Additional parameters - update as needed
```
VITE_TRANSCRIBE_LANGUAGE_CODE=en-US
VITE_TRANSCRIBE_SAMPLING_RATE=48000
VITE_TRANSCRIBE_AUDIO_SOURCE=Microphone 
```
Set `VITE_TRANSCRIBE_AUDIO_SOURCE=ScreenCapture` if you want to capture audio from a browser tab. Default = audio will be captured from Microphone
4. Run the Web application locally
  `yarn`
  `yarn dev`
5. From the browser, go to the web application localhost url (eg. `http://localhost:5173`) and login using the Cognito user id setup in Step 2
6. Click on "Start Transcription" button to start transcribing audio

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

