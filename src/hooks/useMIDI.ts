import { useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export function useMIDI() {
  useEffect(() => {
    let midiAccess: MIDIAccess | null = null;
    
    const onMIDIMessage = (message: MIDIMessageEvent) => {
      const command = message.data[0];
      const note = message.data[1];
      const velocity = message.data.length > 2 ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

      // If we got a signal with velocity 0, it's basically a NoteOff, we usually trigger on NoteOn (velocity > 0)
      if (command === 144 && velocity > 0) { // 144 is NoteOn for Channel 1
         const { togglePlay, stop, seek, currentSong, currentTime } = usePlayerStore.getState();

         if (note === 60) { // Middle C - map to Play/Pause
           togglePlay();
         } else if (note === 62) { // D - Stop
           stop();
         } else if (note === 64) { // E - Next Marker (Vamp / Skip)
            if (currentSong) {
              const currentMarkerIndex = currentSong.markers.findIndex(m => m.startTime > currentTime);
              if (currentMarkerIndex !== -1) {
                seek(currentSong.markers[currentMarkerIndex].startTime);
              }
            }
         } else if (note === 65) { // F - Previous Marker
            if (currentSong) {
               // Find marker just before current time (add tiny buffer so hitting "prev" at start of verse 1 goes to intro)
               const prevMarkers = currentSong.markers.filter(m => m.startTime < currentTime - 1);
               if (prevMarkers.length > 0) {
                 seek(prevMarkers[prevMarkers.length - 1].startTime);
               } else {
                 seek(0);
               }
            }
         }
      }
    };

    const getMIDIMessage = (midiMessage: MIDIMessageEvent) => {
      onMIDIMessage(midiMessage);
    };

    const onStateChange = (e: MIDIConnectionEvent) => {
      const port = e.port;
      if (port.state === 'connected' && port.type === 'input') {
        const input = port as MIDIInput;
        input.onmidimessage = getMIDIMessage;
        console.log(`MIDI connected: ${port.name}`);
      }
    };

    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess()
        .then((access) => {
          midiAccess = access;
          
          // Connect to existing inputs
          // Since Iterator requires explicit casting in older TS versions:
          const inputs = Array.from(midiAccess.inputs.values());
          inputs.forEach((input) => {
            input.onmidimessage = getMIDIMessage;
            console.log(`MIDI registered: ${input.name}`);
          });

          // Listen for new connections
          midiAccess.onstatechange = onStateChange;
        })
        .catch((err) => {
          console.log('MIDI Access failed', err);
        });
    }

    return () => {
      if (midiAccess) {
         midiAccess.onstatechange = null;
         const inputs = Array.from(midiAccess.inputs.values());
         inputs.forEach((input) => {
           input.onmidimessage = null;
         });
      }
    };
  }, []);
}
