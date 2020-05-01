chrome.extension.sendMessage({}, function() {
  const readyStateCheckInterval = setInterval(function() {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      let fileCount = 0;
      let firstFileFound = false;
      function run() {
        document.body.classList.add('gh-file-viewer');

        let fileDetails = getFileDetails();
        let files = to_a(fileDetails);

        fileCount = document.querySelectorAll('div.file').length;
        firstFileFound = false;
        setupFileNavContainer();
        setupFileNavTree(files);
        setupClickHandler();
        mergeProgressiveContainers();
        if (firstFileFound) {
          selectFile(firstFileFound.containerId);
        }
      }

      function mergeProgressiveContainers() {
        const containers = document.querySelectorAll('div.js-diff-progressive-container');

        if (containers.length > 1) {
          const parentContainer = containers[0];

          for (let i = 1; i < containers.length; i += 1) {
            const childContainer = containers[i];

            while (childContainer.childNodes.length > 0) {
              parentContainer.appendChild(childContainer.childNodes[0]);
            }

            childContainer.remove();
          }
        }
      }

      function selectFile(containerId) {
        let files = document.querySelectorAll('div.file');
        for (let file of files) {
          file.style.display = file.id === containerId ? 'block' : 'none';
        }
      }

      function setupClickHandler() {
        let fileNavTree = document.querySelector('div.file-nav-tree');
        if (fileNavTree) {
          fileNavTree.addEventListener('click', (event) => {

            if (event.target.classList.contains('file-tree__label--folder')) {
              let folder = event.target.parentNode;
              if (folder.classList.contains('expanded')) {
                folder.classList.remove('expanded')
              }
              else {
                folder.classList.add('expanded')
              }
            }

            if (event.target.classList.contains('file-tree__folder')) {
              let folder = event.target;
              if (folder.classList.contains('expanded')) {
                folder.classList.remove('expanded')
              }
              else {
                folder.classList.add('expanded')
              }
            }

            if (event.target.classList.contains('file-tree__file')) {
              removeAllFileSelections();
              selectFile(event.target.getAttribute('data-container'));
              event.target.childNodes[0].classList.add('active');
            }

            if (event.target.classList.contains('file-tree__label--file')) {
              removeAllFileSelections();
              selectFile(event.target.getAttribute('data-container'));
              event.target.classList.add('active');
            }
          })
        }
      }

      function removeAllFileSelections() {
        let activeFiles = document.querySelectorAll('.file-tree__label--file.active');
        for (let activeFile of activeFiles) {
          activeFile.classList.remove('active');
        }
      }

      function setupFileNavTree(files) {
        let fileNavTree = document.querySelector('div.file-nav-tree');
        if (fileNavTree) {
          fileNavTree.innerHTML =
            `<ul class="file-tree__wrapper">
              ${files.folders.reduce(_folderReducer, '')}
              ${files.files.reduce(_fileReducer, '')}
            </ul>`;
        }
      }

      function _folderReducer(html, folder) {
        html +=
          `<li class="${getFolderContainerClassList(folder)}">
            <span class="${getFolderClassList(folder)}">
              <svg aria-hidden="true" class="${getFolderIconClassList(folder)}" height="16" version="1.1" viewBox="0 0 14 16" width="14"><path fill-rule="evenodd" d="M13 4H7V3c0-.66-.31-1-1-1H1c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zM6 4H1V3h5v1z"></path></svg>
              &nbsp;${folder.name}
            </span>
            <ul>
              ${folder.folders.reduce(_folderReducer, '')}
              ${folder.files.reduce(_fileReducer, '')}
            </ul>
          </li>`;

        return html;
      }

      function isTestName(name) {
        return name.toLowerCase() === 'spec' || name.toLowerCase() === 'test';
      }

      function getFolderIconClassList(folder) {
        let classes = [
          'octicon',
          'octicon-file-directory',
          'file-tree__label--folder--icon'
        ];

        if (isTestName(folder.name)) {
          classes.push('file-tree__label--folder--icon--spec');
        }

        return classes.join(' ');
      }

      function getFolderContainerClassList(folder) {
        let classes = [
          'file-tree__item',
          'file-tree__folder'
        ];

        if (!firstFileFound || folder.exanded === true) {
          classes.push('expanded');
        }

        if (isTestName(folder.name)) {
          classes.push('file-tree__folder--spec');
        }

        return classes.join(' ');
      }

      function getFolderClassList(folder) {
        let classes = [
          'file-tree__label',
          'file-tree__label--folder'
        ];

        if (isTestName(folder.name)) {
          classes.push('file-tree__label--folder--spec');
        }

        return classes.join(' ');
      }

      function _fileReducer(html, file) {
        html +=
          `<li class="file-tree__item file-tree__file" data-container="${file.containerId}">
            <span class="${getFileClassList(file)}" data-container="${file.containerId}">
              <svg aria-hidden="true" class="${getFileIconClassList(file)}" height="16" version="1.1" viewBox="0 0 12 16" width="12"><path d="M6 5H2V4h4v1zM2 8h7V7H2v1zm0 2h7V9H2v1zm0 2h7v-1H2v1zm10-7.5V14c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h7.5L12 4.5zM11 5L8 2H1v12h10V5z"></path></svg>
              &nbsp;${file.name}
            </span>
          </li>`;

        firstFileFound = firstFileFound || file;

        return html;
      }

      function getFileIconClassList(file) {
        let classes = [
          'file-tree__label--icon',
          'octicon',
          'octicon-file-text'
        ];

        classes.push(`file-tree__label--icon--${file.extension}`);

        return classes.join(' ');
      }

      function getFileClassList(file) {
        let classes = [
          'file-tree__label',
          'file-tree__label--file'
        ];

        classes.push(`file-tree__label--file--${file.extension}`);

        if (!firstFileFound) {
          classes.push('active');
        }

        if (file.fileName.endsWith('_spec')) {
          classes.push('file-tree__label--file--spec');
        }

        return classes.join(' ');
      }

      function setupFileNavContainer() {
        removeFileViewer();
        let fileContainer = document.querySelector('div#files');

        if (fileContainer) {
          fileContainer.insertAdjacentHTML('afterbegin',
            `<div class="file-nav-container">
              <div class="file-header">
                <div class="file-info">
                  <span>Modified Files</span>
                </div>
              </div>
              <div class="file-nav-tree"></div>
            </div>`
          );
        }
      }

      function to_a(fileDetails) {
        let walk = function(files) {
          let nesting = {
            files: [],
            folders: []
          };

          Object.keys(files).forEach((fileName) => {
            let dir = files[fileName];

            if (dir.isFile === true) {
              nesting.files.push(dir);
            }
            else {
              let folder = walk(dir);
              folder.name = fileName.trim();
              folder.exanded = true;
              nesting.folders.push(folder);
            }
          });

          return nesting;
        };

        return walk(fileDetails);
      }

      function getFileDetails() {
        let fileDetails = {};
        let files = document.querySelectorAll('div.file');

        for (let file of files) {
          let isRename = false;
          const header = file.querySelector('div.file-header');
          let path = header.getAttribute('data-path');

          if (path) {
            if (path.indexOf('→') > -1) {
              isRename = true;
              path = path.split('→')[0];
            }

            let pathComponents = path.split('/');
            (function apply(acc, i) {
              let pathComponent = pathComponents[i];

              acc[pathComponent] = acc[pathComponent] || {};

              if (i >= (pathComponents.length - 1)) {
                let fileNames = pathComponent.split('.');

                acc[pathComponent] = {
                  name: pathComponent,
                  path: path,
                  extension: fileNames[fileNames.length - 1],
                  fileName: fileNames[fileNames.length -2] || pathComponent,
                  containerId: file.id,
                  isFile: true,
                  isRename: isRename
                }
              }
              else {
                apply(acc[pathComponent], ++i);
              }
            })(fileDetails, 0);
          }
        }

        return fileDetails;
      }

      function cleanup() {
        document.body.classList.remove('gh-file-viewer');
        removeFileViewer();
      }

      function removeFileViewer() {
        [...document.querySelectorAll('div.file-nav-container')].map(viewer => viewer.remove());
      }

      function update() {
        if (document.querySelector('div#files')) {
          run();
        } else {
          cleanup();
        }
      }

      let currentPage = null;
      setInterval(() =>{
        if (currentPage !== window.location.href) {
            currentPage = window.location.href;
            setTimeout(update, 500);
        } else if (fileCount !== document.querySelectorAll('div.file').length) {
          update();
        }
      }, 500);
    }
  }, 10);
});
