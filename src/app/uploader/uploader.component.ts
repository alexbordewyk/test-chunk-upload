import { Component } from '@angular/core';
import {UploadService} from "../upload.service";
import {map, take, tap} from "rxjs/operators";
import {UploadSession} from "../models/upload-session.model";
import {UploaderFile} from "../models/uploader-file.model";
import {Observable} from "rxjs";

@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.css']
})
export class UploaderComponent {

  uploaderFiles: Observable<UploaderFile>[] = [];

  constructor(private uploadService: UploadService) { }

  onFileSelected(event: any) {
    console.log('events', event);
    const files = event.target.files;

    if (files.length > 0) {
      for(let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const uploaderFile = this.uploadService.createBoxUploadSession(file.name, file.size)
          .pipe(
            map(uploadSession => {
              return {
                uploadSession: uploadSession,
                resumable: this.uploadService.createResumableSession(uploadSession)
              };
            }),
            tap(uploaderFile => {
              uploaderFile.resumable.on('fileSuccess', resumableFile => {
                this.uploadService.commitBoxUploadSession(resumableFile, uploaderFile.uploadSession);
              });
              uploaderFile.resumable.on('fileAdded', _ => {
                uploaderFile.resumable.upload();
              });
              uploaderFile.resumable.addFile(file);
            })
          );

        this.uploaderFiles.push(uploaderFile);
      }
        /*.subscribe((session: UploaderFile) => {
        this.uploadFile(session.resumable, file, session.uploadSession);
      });*/
    }
  }
}
