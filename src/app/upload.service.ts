import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {UploadSession} from "./models/upload-session.model";
import {map, switchMap, take, tap} from "rxjs/operators";
import {Observable, zip} from "rxjs";
import {UploadedParts} from "./models/uploaded-parts.model";
import {DefaultResumableOptions} from "./models/default-resumable-options";
const resumablejs = require('resumablejs');
const CryptoJS = require('crypto-js')

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private uploadSessionUrl = 'https://upload.box.com/api/2.0/files/upload_sessions';
  private storageFolderID = 0;
  private authToken = '';

  constructor(private http: HttpClient) { }

  createBoxUploadSession(fileName: string, fileSize: number): Observable<UploadSession> {
    const body = {
      "folder_id": `${this.storageFolderID}`,
      "file_name": fileName,
      "file_size": fileSize
    };

    return this.http.post(this.uploadSessionUrl, body, { headers: { "Authorization": `Bearer ${this.authToken}` } })
      .pipe(map(response => new UploadSession(response)));
  }

  createResumableSession(uploadSession: UploadSession): resumablejs.Resumable {
    const defaultOptions = new DefaultResumableOptions();
    return new resumablejs({
      ...defaultOptions,
      target: uploadSession.uploadEndpoint,
      chunkSize: uploadSession.chunkSize,
      headers: (resumableFile: resumablejs.ResumableFile, resumableChunk: resumablejs.ResumableChunk) =>
        createChunkHeaders(resumableFile, resumableChunk, this.authToken),
      preprocess: (resumableChunk: resumablejs.ResumableChunk) => preprocessChunk(resumableChunk),
      uploadSession: uploadSession
    })
  }

  commitBoxUploadSession(resumableFile: resumablejs.ResumableFile, uploadSession: UploadSession) {
    zip(this.getUploadSessionParts(uploadSession.listPartsEndpoint), readFile(resumableFile.file))
      .pipe(
        switchMap(([uploadedParts, arrayBuffer]) =>
          this.commitSession(uploadSession, uploadedParts, getHashDigest(arrayBuffer))
        )
      )
      .subscribe(_ => {
        console.log('file was successfully uploaded!');
      });
  }

  private getUploadSessionParts(listPartsEndpoint: string): Observable<UploadedParts> {
    return this.http.get<UploadedParts>(listPartsEndpoint, { headers: { "Authorization": `Bearer ${this.authToken}` } });
  }

  private commitSession(uploadSession: UploadSession, uploadedParts: UploadedParts, fileHash: string): Observable<any> {
    const body = { parts: uploadedParts.entries };

    const headers = {
      headers: {
        "Authorization": `Bearer ${this.authToken}`,
        "Digest": `sha=${fileHash}`
      }
    };

    return this.http.post(uploadSession.commitSessionEndpoint, body, headers);
  }
}

const preprocessChunk = (chunk: resumablejs.ResumableChunk): void => {
  readFile(chunk.fileObj.file.slice(chunk.startByte, chunk.endByte, chunk.fileObjType))
    .pipe(
      take(1),
      map(arrayBuffer => getHashDigest(arrayBuffer as ArrayBuffer))
    )
    .subscribe(hash => {
      chunk.hash = hash;
      chunk.preprocessFinished();
    })
}

const createChunkHeaders = (file: resumablejs.ResumableFile,
                            chunk: resumablejs.ResumableChunk,
                            authToken: string): any => {
  return {
    "Digest": `sha=${chunk.hash}`,
    "Content-Range": `bytes ${chunk.startByte}-${chunk.endByte - 1}/${chunk.fileObjSize}`,
    "Content-Type": 'application/octet-stream',
    "Authorization": `Bearer ${authToken}`
  }
}

const getHashDigest = (arrayBuffer: ArrayBuffer): string => {
  const fileUint8Array = new Uint8Array(arrayBuffer as ArrayBuffer);
  return CryptoJS.SHA1(CryptoJS.lib.WordArray.create(fileUint8Array)).toString(CryptoJS.enc.Base64);
}

const readFile = (blob: Blob): Observable<ArrayBuffer> => {
  return new Observable(obs => {
    if (!(blob instanceof Blob)) {
      obs.error(new Error('`blob` must be an instance of File or Blob.'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = err => obs.error(err);
    reader.onabort = err => obs.error(err);
    reader.onload = () => {
      return obs.next(reader.result as ArrayBuffer);
    }
    reader.onloadend = () => obs.complete();

    return reader.readAsArrayBuffer(blob);
  });
}
