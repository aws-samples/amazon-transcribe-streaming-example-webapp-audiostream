import { useEffect, useState } from 'react'

import {
	BrowserRouter as Router,
	Routes,
	Route
} from "react-router-dom";

import {
	ContentLayout,
	Header,
	SpaceBetween,
	Button,
	Container,
} from '@cloudscape-design/components';
import '@cloudscape-design/global-styles/index.css';


import { Auth } from 'aws-amplify';
import { ICredentials } from "@aws-amplify/core";

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";

async function signOut() {
  try {
      await Auth.signOut();
  } catch (error) {
      console.log('error signing out: ', error);
  }
}

import awsExports from './aws-exports';
import './App.css'
import { Transcript } from './types';
import LiveTranscriptions from './components/LiveTranscriptions';


Auth.configure(awsExports)

function App() {
	const [currentCredentials, setCurrentCredentials] = useState<ICredentials>({
		accessKeyId: "",
		authenticated: false,
		expiration: undefined,
		identityId: "",
		secretAccessKey: "",
		sessionToken: ""
	});
	// const [currentSession, setCurrentSession] = useState<CognitoUserSession>();
	
	const [transcriptionClient, setTranscriptionClient] = useState<TranscribeStreamingClient | null>(null);
	const [transcribeStatus, setTranscribeStatus] = useState<boolean>(false);
	const [transcript, setTranscript] = useState<Transcript>();
	const [lines, setLines] = useState<Transcript[]>([]);
	const [currentLine, setCurrentLine] = useState<Transcript[]>([]);
	const [mediaRecorder, setMediaRecorder] = useState<AudioWorkletNode>();

	useEffect(() => {
		async function getAuth() {
			const currCreds = await Auth.currentUserCredentials()
			return currCreds
		}

		getAuth().then((res) => {
			const currCreds = res;
			setCurrentCredentials(currCreds);
		});
	}, []);

	useEffect(() => {
		if (transcript) {
			setTranscript(transcript);
			if (transcript.partial) {
				setCurrentLine([transcript]);
			} else {
				setLines([...lines, transcript]);
				setCurrentLine([]);
			}
		}
	}, [transcript])
	
	const formFields = {
		signUp: {
			email: {
				order: 1,
				isRequired: true,
			},
			name: {
				order: 2,
				isRequired: true,
			},
			password: {
				order: 3,
			},
			confirm_password: {
				order: 4,
			},
		},
	};

	const handleTranscribe = async () => {
		setTranscribeStatus(!transcribeStatus);
		if (transcribeStatus) {
			console.log("Stopping transcription")
		} else {
			console.log("Starting transcription")
		}
		return transcribeStatus;
	};

	return (
		<Router>
			<Authenticator loginMechanisms={['email']} formFields={formFields}>
				{() => (
					<>
						<Routes>
							<Route path="/" element={<>
									<ContentLayout
										header={
											<SpaceBetween size="m">
												<Header
													variant="h1"
													description="Demo of live transcriptions"
													actions={
														<SpaceBetween direction="horizontal" size="m">															
															<Button variant='primary' onClick={handleTranscribe}>
																{ transcribeStatus ? "Stop Transcription" : "Start Transcription" } 
															</Button>

															<Button variant='primary' onClick={signOut}>
																Sign out
															</Button>
														</SpaceBetween>
													}
												>
													Amazon Transcribe Live Transcriptions
												</Header>
											</SpaceBetween>
										}
									>
										<Container
													header={
														<Header
															variant="h2"
														>
															Transcriptions
														</Header>
													}
											>
												<SpaceBetween size='xs'>
													<div style={{height: '663px'}} className={"transcriptionContainer"}>
														{lines.map((line, index) => {
																return (
																	<div key={index}>
																		<strong>Channel {line.channel}</strong>: {line.text}
																		<br/>
																	</div>
																)
															})
														}
														{currentLine.length > 0 && 
															currentLine.map((line, index) => {
																return (
																	<div key={index}>
																		<strong>Channel {line.channel}</strong>: {line.text}
																		<br/>
																	</div>
																)
															})
														}
													</div>
												</SpaceBetween>
										</Container>

									</ContentLayout>
									<LiveTranscriptions
										currentCredentials={currentCredentials}
										mediaRecorder={mediaRecorder}
										setMediaRecorder={setMediaRecorder}
										setTranscriptionClient={setTranscriptionClient}
										transcriptionClient={transcriptionClient}
										transcribeStatus={transcribeStatus}
										setTranscript={setTranscript}
									/>
								</>
							}/>
						</Routes>
					</>
				)}
			</Authenticator>
		</Router>
	);
}

export default App
