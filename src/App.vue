<template>
  <div id="app">
    <h1>
      <input type="file" @change="handleFileChange" />
      <button @click="handleUpload">上传</button>
    </h1>
    <span>{{
      allChunksUploaded ? "完成" : "上传进度：" + uploadProcess + "%"
    }}</span>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Axios, { AxiosResponse } from "axios";
import QS from "qs";
import { randomId } from "./util/IdUtil";
import _ from "lodash";
import {
  ChunkUploadResult,
  isChunkUploadResult,
} from "./dto/ChunkUploadResult";

type FileChunks = {
  file: File;
  chunks: { start: number; end: number }[];
};

@Component
export default class App extends Vue {
  container: { file: null | File } = { file: null };
  chunkSize = 10 * 1024 * 1024; // 文件块大小10M
  allChunksUploaded = false;
  uploadProcess = 0;
  handleFileChange(e: Event) {
    const files = (e.target! as any).files;
    if (!files || files.length === 0) return;
    this.container.file = files[0];
    // 将上传完成状态置否
    this.allChunksUploaded = false;
  }

  makeChunks(file: File): FileChunks {
    const fileChunks: FileChunks = {
      file,
      chunks: [],
    };
    if (file.size < this.chunkSize) {
      fileChunks.chunks.push({ start: 0, end: file.size });
      return fileChunks;
    }
    let chunksLength;
    if (file.size % this.chunkSize === 0) {
      chunksLength = Math.round(Math.floor(file.size / this.chunkSize));
    } else {
      chunksLength = Math.round(Math.floor(file.size / this.chunkSize)) + 1;
    }
    let leftSize = file.size;
    while (leftSize > 0) {
      const start = fileChunks.chunks.length * this.chunkSize;
      const end =
        start + this.chunkSize >= file.size
          ? file.size
          : start + this.chunkSize;
      leftSize -= end - start;
      fileChunks.chunks.push({ start, end });
    }
    return fileChunks;
  }

  handleUpload(e: any) {
    console.log(`file: ${JSON.stringify(this.container.file)}`);
    const fileChunks = this.makeChunks(this.container.file!);
    const allChunksUploadStatus = _.fill(
      new Array(fileChunks.chunks.length),
      false
    );
    // 重置上传进度的状态
    this.allChunksUploaded = false;
    this.uploadProcess = 0;
    // 计算上传进度
    const calUploadProcess = (): number => {
      let uploadedCount = 0;
      _.each(allChunksUploadStatus, (item) => {
        if (item) uploadedCount++;
      });
      return new Number(
        ((uploadedCount * 100) / allChunksUploadStatus.length).toFixed(0)
      ).valueOf();
    };
    // 生成uid，传递给后端，后端根据uid对子文件块进行合并
    const fileUid = randomId();
    fileChunks.chunks.forEach(
      (chunk: { start: number; end: number }, index: number) => {
        const formData = new FormData();
        formData.append("index", index + "");
        formData.append("chunk", fileChunks.file.slice(chunk.start, chunk.end));
        formData.append("name", fileChunks.file.name);
        formData.append("chunksLength", fileChunks.chunks.length + "");
        formData.append("uid", fileUid);
        Axios.post<ChunkUploadResult>("/api/fileupload", formData)
          .catch((reason) => console.error(`error: ${JSON.stringify(reason)}`))
          .then((res) => {
            if (typeof res === "object") {
              const data = res.data;
              if (isChunkUploadResult(data)) {
                if (data.status) {
                  allChunksUploadStatus[index] = true;
                  // 更新上传百分比
                  this.uploadProcess = calUploadProcess();
                  // 更新上传状态
                  if (this.uploadProcess === 100) this.allChunksUploaded = true;
                }
              }
            }
          });
      }
    );
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
