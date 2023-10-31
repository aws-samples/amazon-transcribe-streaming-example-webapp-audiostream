
import { useEffect } from "react";

import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  LanguageCode
} from '@aws-sdk/client-transcribe-streaming';
import { ICredentials } from "@aws-amplify/core";
import pEvent from 'p-event';

import {
  RecordingProperties,
  MessageDataType,
  LiveTranscriptionProps
} from "../types";

const language = import.meta.env.VITE_TRANSCRIBE_LANGUAGE_CODE as LanguageCode;

const startStreaming = async (
  handleTranscribeOutput: (data: string, partial: boolean, transcriptionClient: TranscribeStreamingClient, mediaRecorder: AudioWorkletNode) => void,
  currentCredentials: ICredentials,
) => {

  const audioContext = new window.AudioContext();
  const videostream = await window.navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });
  const track1 = videostream.getAudioTracks()[0];
  
  const micstream = await window.navigator.mediaDevices.getUserMedia({
    video: false,
    audio: true,
  });
  const track2 = micstream.getAudioTracks()[0]

  const source1 = audioContext.createMediaStreamSource(new MediaStream([track2]));
  const source2 = audioContext.createMediaStreamSource(new MediaStream([track1]));

  const merger = audioContext.createChannelMerger(2);
  source1.connect(merger,0, 0);
  source2.connect(merger,0, 1);

  // console.log(`Screen Capture capabilities : ${JSON.stringify(track1.getCapabilities())}`);
  // console.log(`Mic capture capabitlities : ${JSON.stringify(track2.getCapabilities())}`);
  // console.log(`AudioContext Sample rate: ${audioContext.sampleRate}`);

  try {
    await audioContext.audioWorklet.addModule('./worklets/recording-processor.js');
  } catch (error) {
    console.log(`Add module error ${error}`);
  }

  const recordingprops: RecordingProperties = {
    numberOfChannels: 2,
    sampleRate: audioContext.sampleRate,
    maxFrameCount: audioContext.sampleRate * 1 / 10
  };

  const mediaRecorder = new AudioWorkletNode(
    audioContext,
    'recording-processor',
    {
      processorOptions: recordingprops,
    },
  );

  mediaRecorder.port.postMessage({
    message: 'UPDATE_RECORDING_STATE',
    setRecording: true,
  });

  const destination = audioContext.createMediaStreamDestination();
  merger.connect(mediaRecorder).connect(destination);
  
  mediaRecorder.port.onmessageerror = (error) => {
    console.log(`Error receving message from worklet ${error}`);
  };

  const audioDataIterator = pEvent.iterator<'message', MessageEvent<MessageDataType>>(mediaRecorder.port, 'message');

  const getAudioStream = async function* () {
    for await (const chunk of audioDataIterator) {
      if (chunk.data.message === 'SHARE_RECORDING_BUFFER') {
        const buffer = new Uint8Array(interleave(chunk.data.buffer[0], chunk.data.buffer[1]));
        yield {
          AudioEvent: {
            AudioChunk: buffer,
          },
        };
      }
    }
  };
  const transcribeClient = new TranscribeStreamingClient({
    region: 'us-east-1',
    credentials: currentCredentials,
  });

  const command = new StartStreamTranscriptionCommand({
    LanguageCode: language,
    MediaEncoding: 'pcm',
    MediaSampleRateHertz: audioContext.sampleRate,
    AudioStream: getAudioStream(),
    NumberOfChannels: 2,
    EnableChannelIdentification: true,
  });
  const data = await transcribeClient.send(command);
  console.log('Transcribe sesssion established ', data.SessionId);


  if (data.TranscriptResultStream) {
    for await (const event of data.TranscriptResultStream) {
      if (event?.TranscriptEvent?.Transcript) {
        for (const result of event?.TranscriptEvent?.Transcript.Results || []) {
          if (result?.Alternatives && result?.Alternatives[0].Items) {
            let completeSentence = ``;
            for (let i = 0; i < result?.Alternatives[0].Items?.length; i++) {
              completeSentence += ` ${result?.Alternatives[0].Items[i].Content}`;
            }
            completeSentence = `${result?.ChannelId} :`+completeSentence;
            if (!result.IsPartial) console.log(`Transcription: ${completeSentence}`);
            handleTranscribeOutput(
              completeSentence,
              result.IsPartial || false,
              transcribeClient,
              mediaRecorder,
            );
          }
        }
      }
    }
  }
};


const stopStreaming = async (
  mediaRecorder: AudioWorkletNode,
  transcribeClient: { destroy: () => void; }
) => {
  if (mediaRecorder) {
    mediaRecorder.port.postMessage({
      message: 'UPDATE_RECORDING_STATE',
      setRecording: false,
    });
    mediaRecorder.port.close();
    mediaRecorder.disconnect();
  } else {
    console.log('no media recorder available to stop');
  }

  if (transcribeClient) {
    transcribeClient.destroy();
  }
};

const LiveTranscriptions = (props: LiveTranscriptionProps) => {
  const {
    transcribeStatus,
    mediaRecorder,
    transcriptionClient,
    currentCredentials,
    setMediaRecorder,
    setTranscriptionClient,
    setTranscript,
  } = props;

  const onTranscriptionDataReceived = (
    data: string,
    partial: boolean,
    transcriptionClient: TranscribeStreamingClient,
    mediaRecorder: AudioWorkletNode,
  ) => {
    setTranscript({
      channel: '0',
      partial: partial,
      text: data,
    });
    setMediaRecorder(mediaRecorder);
    setTranscriptionClient(transcriptionClient);
  };

  const startRecording = async () => {
    if (!currentCredentials) {
      console.error('credentials not found');
      return;
    }
    try {
      await startStreaming(
        onTranscriptionDataReceived,
        currentCredentials,
      );
    } catch (error) {
      alert(`An error occurred while recording: ${error}`);
      await stopRecording();
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder && transcriptionClient) {
      await stopStreaming(mediaRecorder, transcriptionClient);
    } else {
      console.log('no media recorder');
    }
  };

  async function toggleTranscribe() {

    if (transcribeStatus) {
      console.log('startRecording');
      await startRecording();
    } else {
      console.log('stopRecording');
      await stopRecording();
    }
  }

  useEffect(() => {
    toggleTranscribe();
  }, [transcribeStatus]);

  return (
    <></>
  );
}

export default LiveTranscriptions;



const pcmEncode = (input:Float32Array) => {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
};

const interleave = (lbuffer:Float32Array, rbuffer:Float32Array) => {
  let left_audio_buffer = new ArrayBuffer(lbuffer.length*2);
  left_audio_buffer = pcmEncode(lbuffer);
  const left_view = new DataView(left_audio_buffer);

  let right_audio_buffer = new ArrayBuffer(rbuffer.length*2);
  right_audio_buffer = pcmEncode(rbuffer);
  const right_view = new DataView(right_audio_buffer);

  let buffer = new ArrayBuffer(left_audio_buffer.byteLength*2);
  const view = new DataView(buffer);

  for (let i=0, j=0; i<left_audio_buffer.byteLength/2; i+=2, j+=4) {
    view.setInt16(j, left_view.getInt16(i, true), true);
    view.setInt16(j+2, right_view.getInt16(i, true), true);
  }
  return buffer;
}