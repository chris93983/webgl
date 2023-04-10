const fileInput = document.querySelector<HTMLInputElement>('#fileInput');
const [headerSize, chunkSize, chunkHeaderSize, headerString, chunkHeaderString] = [4096, 65536, 512, 'ElfFile\0', 'ElfChnk\0'];
const [decoder, le] = [new TextDecoder(), true];
let [readSize, fileBuffer] = [0, new ArrayBuffer(0)];

fileInput.addEventListener('input', event => {
    if (fileInput.files.length) {
        const [file, reader] = [fileInput.files[0], new FileReader()];
        console.log('file', file);
        reader.onload = (onload) => {
            // console.log('reader onload', onload.target.result);
            fileBuffer = onload.target.result as ArrayBuffer;
            console.log('bytelength', fileBuffer.byteLength);
            const headerBuffer = fileBuffer.slice(0, headerSize);
            const header = decoder.decode(headerBuffer);
            readSize += headerSize;
            // console.log('header', header.length, header);
            const headerDataView = new DataView(headerBuffer);
            // console.log('headerDataView', headerDataView);
            
            const [firstChunk, lastChunk, nextIndex] = [headerDataView.getBigUint64(8, le), headerDataView.getBigUint64(16, le), headerDataView.getBigUint64(24, le)];
            const [assertNumber, minorVersion, majorVersion] = [headerDataView.getUint32(32, le), headerDataView.getUint16(36, le), headerDataView.getUint16(38, le)];
            const [size, chunkCount, fileFlag, crc32] = [headerDataView.getUint16(40, le), headerDataView.getUint16(42, le), headerDataView.getUint32(120, le), headerDataView.getUint32(124, le)];
            console.log('firstChunk, lastChunk, nextIndex, assertNumber', firstChunk, lastChunk, nextIndex, assertNumber);
            console.log('version', majorVersion, minorVersion);
            console.log('size, chunkCount, fileFlag, crc32', size, chunkCount, fileFlag, crc32);

            if (header.length === headerSize && header.startsWith(headerString)) {
                console.log('read chunk');
                readChunk();
            }
        };
        reader.readAsArrayBuffer(file);
    }
});

const readChunk = () => {
    if (fileBuffer.byteLength - readSize >= chunkSize) {
        const chunk = new DataView(fileBuffer.slice(readSize, readSize + chunkSize));

        if (decoder.decode(chunk).startsWith(chunkHeaderString)) {
            const [firstEvent, lastEvent, firstEventId, lastEventId, headerSize, lastEventOffset, freeSpace, eventCRC32] = 
                [chunk.getBigUint64(8, le), chunk.getBigUint64(16, le), chunk.getBigUint64(24, le), chunk.getBigUint64(32, le), chunk.getUint32(40, le), chunk.getUint32(44, le), chunk.getUint32(48, le), chunk.getUint32(52, le)];
            console.log('firstEvent, lastEvent, firstEventId, lastEventId, headerSize, lastEventOffset, freeSpace, eventCRC32', firstEvent, lastEvent, firstEventId, lastEventId, headerSize, lastEventOffset, freeSpace, eventCRC32);
            const CRC32 = chunk.getUint32(56, le);
            console.log('CRC32', CRC32);
            const [keys, templates] = [[], []];
            let position = 60;

            for(var i = 0; i < 64; i++) {
                keys.push(chunk.getUint32(position, le));
                position += 4;
            }

            for(var i = 0; i < 32; i++) {
                templates.push(chunk.getUint32(position, le));
                position += 4;
            }

            console.log('keys', keys);
            console.log('templates', templates);
        }
    }
};