# quill-image-video-extend-module
vue-quill-editor的增强模块，

功能：
 - 提供图片和视频上传到服务器的功能
 - 显示上传进度
 - 显示上传成功或者失败
 - 解决同时上传视频和图片的冲突问题


## Install
```
npm install quill-image-video-extend-module --save-dev
```

## use
``` import {quillEditor, Quill} from 'vue-quill-editor';
    import {container, ImageVideoExtend, QuillWatch} from 'quill-image-video-extend-module';
    import Axios from 'axios';
    Quill.register('modules/ImageVideoExtendId', ImageVideoExtend);
```
## example
```<template>
    <div>
        <quill-editor
                v-model="content"
                ref="myQuillEditor"
                :options="editorOption"
        >
        </quill-editor>

    </div>
</template>
<script>
    import {quillEditor, Quill} from 'vue-quill-editor';
    import {container, ImageVideoExtend, QuillWatch} from 'quill-image-video-extend-module';

    Quill.register('modules/ImageVideoExtendId', ImageVideoExtend);
    export default {
        components: {quillEditor},
        data() {
            return {
                content: '',
                title: '',
                editorOption: {
                    modules: {
                        ImageVideoExtendId: {
                            loading: true,
                            name: 'file',
                            action: "http://127.0.0.1/file_upload",         //图片上传地址
                            response: (res) => {
                                return "http://127.0.0.1/" + res.data;   //上传成功返回的图片地址
                            }
                        },
                        toolbar: {
                            container: container,
                            handlers: {
                                'image': function () {
                                    QuillWatch.emit(this.quill.id, 1, "image")
                                },
                                'video': function () {
                                    QuillWatch.emit(this.quill.id, 1, "video")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
</script>

<style>

</style>

```