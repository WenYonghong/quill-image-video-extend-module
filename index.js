/**
 *@description 观察者模式 全局监听富文本编辑器
 */
export const QuillWatch = {
    watcher: {},  // 登记编辑器信息
    active: null,  // 当前触发的编辑器
    on: function (ImageVideoExtendId, ImageVideoExtend) {  // 登记注册使用了ImageVideoExtend的编辑器
        if (!this.watcher[ImageVideoExtendId]) {
            this.watcher[ImageVideoExtendId] = ImageVideoExtend
        }
    },
    emit: function (activeId, type = 1,iv) {  // 事件发射触发
        this.active = this.watcher[activeId]
        if (iv === "image") {
            imgHandler()
        }else{
			videoHandler()
		}
    }
}

/**
 * @description 图片功能拓展： 增加上传 拖动 复制
 */
export class ImageVideoExtend {
    /**
     * @param quill {Quill}富文本实例
     * @param config {Object} options
     * config  keys: action, headers, editForm start end error  size response
     */
    constructor(quill, config = {}) {
        this.id = Math.random()
        this.quill = quill
        this.quill.id = this.id
        this.config = config
        this.file = ''  // 要上传的图片或者视频
        this.imgURL = ''  // 图片视频地址
        quill.root.addEventListener('paste', this.pasteHandle.bind(this), false)
        quill.root.addEventListener('drop', this.dropHandle.bind(this), false)
        quill.root.addEventListener('dropover', function (e) {
            e.preventDefault()
        }, false)
        this.cursorIndex = 0
        QuillWatch.on(this.id, this)
    }

    /**
     * @description 粘贴
     * @param e
     */
    pasteHandle(e) {
        // e.preventDefault()
        QuillWatch.emit(this.quill.id, 0)
        let clipboardData = e.clipboardData
        let i = 0
        let items, item, types

        if (clipboardData) {
            items = clipboardData.items;

            if (!items) {
                return;
            }
            item = items[0];
            types = clipboardData.types || [];

            for (; i < types.length; i++) {
                if (types[i] === 'Files') {
                    item = items[i];
                    break;
                }
            }
            if (item && item.kind === 'file' && item.type.match(/^image\//i)) {
                this.file = item.getAsFile()
                let selfss = this
                // 如果图片限制大小
                if (selfss.config.size && selfss.file.size >= selfss.config.size * 1024 * 1024) {
                    if (selfss.config.sizeError) {
                        selfss.config.sizeError()
                    }
                    return
                }
                if (this.config.action) {
                    // this.uploadImg()
                } else {
                    // this.toBase64()
                }
            }
        }
    }

    /**
     * 拖拽
     * @param e
     */
    dropHandle(e) {
        QuillWatch.emit(this.quill.id, 0)
        const selfss = this
        e.preventDefault()
        // 如果图片限制大小
        if (selfss.config.size && selfss.file.size >= selfss.config.size * 1024 * 1024) {
            if (selfss.config.sizeError) {
                selfss.config.sizeError()
            }
            return
        }
        selfss.file = e.dataTransfer.files[0]; // 获取到第一个上传的文件对象
        if (this.config.action) {
            selfss.uploadImg()
        } else {
            selfss.toBase64()
        }
    }

    /**
     * @description 将图片转为base4
     */
    toBase64() {
        const selfss = this
        const reader = new FileReader()
        reader.onload = (e) => {
            // 返回base64
            selfss.imgURL = e.target.result
            selfss.insertImg()
        }
        reader.readAsDataURL(selfss.file)
    }

    /**
     * @description 上传图片到服务器
     */
    uploadImg() {
        const selfss = this
        let quillLoading = selfss.quillLoading
        let config = selfss.config
        // 构造表单
        let formData = new FormData()
        formData.append(config.name, selfss.file)
        // 自定义修改表单
        if (config.editForm) {
            config.editForm(formData)
        }
        // 创建ajax请求
        let xhr = new XMLHttpRequest()
        xhr.open('post', config.action, true)
        // 如果有设置请求头
        if (config.headers) {
            config.headers(xhr)
        }
        if (config.change) {
            config.change(xhr, formData)
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    //success
                    let res = JSON.parse(xhr.responseText)
                    selfss.imgURL = config.response(res)
					  if(   selfss.imgURL=="error"){
					     QuillWatch.active.uploadError();
						 return;
				  }
                    QuillWatch.active.uploadSuccess()
                    selfss.insertImg()
                    if (selfss.config.success) {
                        selfss.config.success()
                    }
                } else {
                    //error
                    if (selfss.config.error) {
                        selfss.config.error()
                    }
                    QuillWatch.active.uploadError()
                }
            }
        }
        // 开始上传数据
        xhr.upload.onloadstart = function (e) {
            QuillWatch.active.uploading()
            // let length = (selfss.quill.getSelection() || {}).index || selfss.quill.getLength()
            // selfss.quill.insertText(length, '[uploading...]', { 'color': 'red'}, true)
            if (config.start) {
                config.start()
            }
        }
        // 上传过程
        xhr.upload.onprogress = function (e) {
            let complete = (e.loaded / e.total * 100 | 0) + '%'
            QuillWatch.active.progress(complete)
        }
        // 当发生网络异常的时候会触发，如果上传数据的过程还未结束
        xhr.upload.onerror = function (e) {
            QuillWatch.active.uploadError()
            if (config.error) {
                config.error()
            }
        }
        // 上传数据完成（成功或者失败）时会触发
        xhr.upload.onloadend = function (e) {
			  console.log("打印完成"+JSON.stringify(e));
            if (config.end) {
                config.end()
            }
        }
        xhr.send(formData)
    }

	 /**
   * @description 上传视频到服务器
   */
  uploadVideo() {
      const selfss = this
      let quillLoading = selfss.quillLoading
      let config = selfss.config
      // 构造表单
      let formData = new FormData()
      formData.append(config.name, selfss.file)
      // 自定义修改表单
      if (config.editForm) {
          config.editForm(formData)
      }
      // 创建ajax请求
      let xhr = new XMLHttpRequest()
      xhr.open('post', config.action, true)
      // 如果有设置请求头
      if (config.headers) {
          config.headers(xhr)
      }
      if (config.change) {
          config.change(xhr, formData)
      }
      xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                  //success
                  let res = JSON.parse(xhr.responseText)
                  selfss.videoURL = config.response(res)
				  if(   selfss.videoURL=="error"){
					     QuillWatch.active.uploadError();
						 return;
				  }
                  QuillWatch.active.uploadSuccess()
                  selfss.insertVideo()
                  if (selfss.config.success) {
                      selfss.config.success()
                  }
              } else {
                  //error
                  if (selfss.config.error) {
                      selfss.config.error()
                  }
                  QuillWatch.active.uploadError()
              }
          }
      }
      // 开始上传数据
      xhr.upload.onloadstart = function (e) {
          QuillWatch.active.uploading()
          // let length = (selfss.quill.getSelection() || {}).index || selfss.quill.getLength()
          // selfss.quill.insertText(length, '[uploading...]', { 'color': 'red'}, true)
          if (config.start) {
              config.start()
          }
      }
      // 上传过程
      xhr.upload.onprogress = function (e) {
          let complete = (e.loaded / e.total * 100 | 0) + '%'
          QuillWatch.active.progress(complete)
      }
      // 当发生网络异常的时候会触发，如果上传数据的过程还未结束
      xhr.upload.onerror = function (e) {
          QuillWatch.active.uploadError()
          if (config.error) {
              config.error()
          }
      }
      // 上传数据完成（成功或者失败）时会触发
      xhr.upload.onloadend = function (e) {
		  
		  console.log("打印完成"+JSON.stringify(e));
          if (config.end) {
              config.end()
          }
      }
      xhr.send(formData)
  }

	
    /**
     * @description 往富文本编辑器插入图片
     */
    insertImg() {
        const selfss = QuillWatch.active
        selfss.quill.insertEmbed(QuillWatch.active.cursorIndex, 'image', selfss.imgURL)
        selfss.quill.update()
        selfss.quill.setSelection(selfss.cursorIndex+1);
    }

	  /**
   * @description 往富文本编辑器插入视频
   */
  insertVideo() {
      const selfss = QuillWatch.active
      selfss.quill.insertEmbed(QuillWatch.active.cursorIndex, 'video', selfss.videoURL)
      selfss.quill.update()
      selfss.quill.setSelection(selfss.cursorIndex+1);
  }
	
	


    /**
     * @description 显示上传的进度
     */
    progress(pro) {
        pro = '[' + 'uploading' + pro + ']'
        QuillWatch.active.quill.root.innerHTML
            = QuillWatch.active.quill.root.innerHTML.replace(/\[uploading.*?\]/, pro)
    }

    /**
     * 开始上传
     */
    uploading() {
        let length = (QuillWatch.active.quill.getSelection() || {}).index || QuillWatch.active.quill.getLength()
        QuillWatch.active.cursorIndex = length
        QuillWatch.active.quill.insertText(QuillWatch.active.cursorIndex, '[uploading...]', {'color': 'red'}, true)
    }

    /**
     * 上传失败
     */
    uploadError() {
        QuillWatch.active.quill.root.innerHTML
            = QuillWatch.active.quill.root.innerHTML.replace(/\[uploading.*?\]/, '[upload error]')
    }

    uploadSuccess() {
        QuillWatch.active.quill.root.innerHTML
            = QuillWatch.active.quill.root.innerHTML.replace(/\[uploading.*?\]/, '')
    }
}

/**
 * @description 点击图片上传
 */
export function imgHandler() {
    let filenput = document.querySelector('.quill-image-input');
    if (filenput === null) {
        filenput = document.createElement('input');
        filenput.setAttribute('type', 'file');
        filenput.classList.add('quill-image-input');
        filenput.style.display = 'none'
        // 监听选择文件
        filenput.addEventListener('change', function () {
            var selfss = QuillWatch.active;
				
		      selfss.file = filenput.files[0]
            filenput.value = ''
            // 如果图片限制大小
            if (selfss.config.size && selfss.file.size >= selfss.config.size * 1024 * 1024) {
                if (selfss.config.sizeError) {
                    selfss.config.sizeError()
                }
                return
            }
            if (selfss.config.action) {
                selfss.uploadImg()
            } else {
                selfss.toBase64()
            }
        })
        document.body.appendChild(filenput);
    }
    filenput.click();
}


export function videoHandler() {
  let fileInput = document.querySelector('.quill-video-input');
  if (fileInput === null) {
      fileInput = document.createElement('input');
      fileInput.setAttribute('type', 'file');
      fileInput.classList.add('quill-video-input');
      fileInput.style.display = 'none'
      // 监听选择文件
      fileInput.addEventListener('change', function () {
          let selfss = QuillWatch.active
		  console.log(fileInput.files[0]);
          selfss.file = fileInput.files[0]
          fileInput.value = ''
          // 如果视频限制大小
          if (selfss.config.size && selfss.file.size >= selfss.config.size * 1024 * 1024) {
              if (selfss.config.sizeError) {
                  selfss.config.sizeError()
              }
              return
          }
          if (selfss.config.action) {
              selfss.uploadVideo()
          } else {
              selfss.toBase64()
          }
      })
      document.body.appendChild(fileInput);
  }
  fileInput.click();
}

/**
 *@description 全部工具栏
 */
export const container = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{'header': 1}, {'header': 2}],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    [{'script': 'sub'}, {'script': 'super'}],
    [{'indent': '-1'}, {'indent': '+1'}],
    [{'direction': 'rtl'}],
    [{'size': ['small', false, 'large', 'huge']}],
    [{'header': [1, 2, 3, 4, 5, 6, false]}],
    [{'color': []}, {'background': []}],
    [{'font': []}],
    [{'align': []}],
    ['clean'],
    ['link', 'image', 'video']
]



