import { Component } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {map, switchMap, take} from "rxjs/operators";
import {UploadSession} from "./models/upload-session.model";
import {Observable} from "rxjs";
import {UploadedParts} from "./models/uploaded-parts.model";
const resumablejs = require('resumablejs');
const CryptoJS = require('crypto-js')

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  fileName: string = '';
  fileProgress: number = 0;
  // @ts-ignore
  uploadSession: UploadSession;

  private uploadSessionUrl = 'https://upload.box.com/api/2.0/files/upload_sessions';
  private storageFolderID = 0;
  private authToken = 'sU7Nhif8MoX4aL1WAdqQARU5szAX9kVr';

  constructor(private http: HttpClient) { }

  onFileSelected(event: any) {

    const file:File = event.target.files[0];

    if (file) {
      this.fileName = file.name;

      this.createUploadSession(file.name, file.size)
        .pipe(
          map(uploadSession => this.createResumableSession(uploadSession)),
          take(1)
        ).subscribe(resumable => {
          this.uploadResumableFile(resumable, file);
      });
    }
  }

  private createResumableSession(uploadSession: UploadSession): resumablejs.Resumable {
    this.uploadSession = uploadSession;

    return new resumablejs({
      target: uploadSession.uploadEndpoint,
      chunkSize: uploadSession.chunkSize,
      simultaneousUploads: 1,
      testChunks:false,
      forceChunkSize: true,
      chunkNumberParameterName: null,
      totalChunksParameterName: null,
      chunkSizeParameterName: null,
      totalSizeParameterName: null,
      identifierParameterName: null,
      maxFiles: 1,
      fileNameParameterName: null,
      relativePathParameterName: null,
      currentChunkSizeParameterName: null,
      setChunkTypeFromFile: false,
      typeParameterName: null,
      maxChunkRetries: 0,
      uploadMethod: 'PUT',
      method: 'octet',
      headers: (file: resumablejs.ResumableFile, chunk: resumablejs.ResumableChunk) => {
        return {
          "Digest": `sha=${chunk.hash}`,
          "Content-Range": `bytes ${chunk.startByte}-${chunk.endByte - 1}/${chunk.fileObjSize}`,
          "Content-Type": 'application/octet-stream',
          "Authorization": `Bearer ${this.authToken}`
        }
      },
      preprocess: (chunk: resumablejs.ResumableChunk) => {
        const reader = new FileReader();

        reader.onload = () => {
          const fileUint8Array = new Uint8Array(reader.result as ArrayBuffer);
          const hash = CryptoJS.SHA1(CryptoJS.lib.WordArray.create(fileUint8Array));
          chunk.hash = hash.toString(CryptoJS.enc.Base64);
          chunk.preprocessFinished();
        }

        reader.readAsArrayBuffer(chunk.fileObj.file.slice(chunk.startByte, chunk.endByte, chunk.fileObjType));
      }
    })
  }

  private createUploadSession(fileName: string, fileSize: number): Observable<UploadSession> {
    const body = {
      "folder_id": `${this.storageFolderID}`,
      "file_name": fileName,
      "file_size": fileSize
    };

    return this.http.post(this.uploadSessionUrl, body, { headers: { "Authorization": `Bearer ${this.authToken}` } })
      .pipe(map(response => new UploadSession(response)));
  }

  private commitUploadSession(resumableFile: resumablejs.ResumableFile): void {
    const reader = new FileReader();

    reader.onload = () => {
      const fileUint8Array = new Uint8Array(reader.result as ArrayBuffer);
      const hash = CryptoJS.SHA1(CryptoJS.lib.WordArray.create(fileUint8Array)).toString(CryptoJS.enc.Base64);
      this.http.get<UploadedParts>(this.uploadSession.listPartsEndpoint, { headers: { "Authorization": `Bearer ${this.authToken}` } })
        .pipe(
          switchMap(uploadedParts => {
            const body = {parts: uploadedParts.entries};
            const headers = {
              headers: {
                "Authorization": `Bearer ${this.authToken}`,
                "Digest": `sha=${hash}`
              }
            };
            return this.http.post(this.uploadSession.commitSessionEndpoint, body, headers);
          }),
          take(1)
        )
        .subscribe(response => {
          console.log('completed session response:', response);
        });
    }

    reader.readAsArrayBuffer(resumableFile.file);
  }

  private uploadResumableFile(resumable: resumablejs.Resumable, file: File): void {
    resumable.on('fileProgress', resumableFile => {
      this.fileProgress = resumableFile.progress(false);
    });
    resumable.on('fileSuccess', resumableFile => {
      this.commitUploadSession(resumableFile);
    });
    resumable.on('error', message => {
      console.error('Something went wrong!', message);
    });
    resumable.on('fileAdded', addedFile => {
      resumable.upload();
    });
    resumable.addFile(file);
  }
}
