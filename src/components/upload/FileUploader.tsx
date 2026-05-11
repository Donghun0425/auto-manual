/**
 * 파일 업로더 컴포넌트
 * - 단일/멀티 파일 및 폴더 업로드 지원
 * - 드래그 앤 드롭 지원
 * - .clx.js 확장자 필터링
 */
import { useCallback, useRef, useState } from 'react';
import { Upload, File, FolderOpen } from 'lucide-react';
import { useFileStore } from '@/stores/fileStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function FileUploader() {
  const addFiles = useFileStore((s) => s.addFiles);
  const [isDragging, setIsDragging] = useState(false);

  // 단일/멀티 파일 입력 ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 폴더 입력 ref
  const folderInputRef = useRef<HTMLInputElement>(null);

  /**
   * File 배열을 읽어서 스토어에 추가
   * - FileList가 아닌 File[] 배열을 받아 input 초기화 후에도 안전하게 처리
   * - Promise.all로 병렬 읽기하여 대량 파일도 누락 없이 처리
   * @param files - File 객체 배열
   */
  const processFiles = useCallback(
    async (files: File[]) => {
      // .clx.js 파일만 필터링 후 내용을 병렬로 읽기
      const clxFiles = files.filter((f) => f.name.endsWith('.clx.js'));

      const entries = await Promise.all(
        clxFiles.map(async (file) => {
          const content = await file.text();
          // webkitRelativePath가 있으면 폴더 경로 포함, 없으면 파일명만
          const path = (file.webkitRelativePath || file.name).replace(/\\/g, '/');
          return { path, content };
        })
      );

      if (entries.length > 0) {
        addFiles(entries);
      }
    },
    [addFiles]
  );

  /**
   * 파일 선택 변경 핸들러
   * - FileList를 즉시 Array로 복사한 뒤 input을 초기화해야 함
   *   (e.target.value = '' 시 브라우저가 FileList를 무효화하기 때문)
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      // ★ input 초기화 전에 File 객체를 배열로 복사 — 이것이 파일 누락의 핵심 원인
      const files = Array.from(fileList);
      e.target.value = ''; // 동일 파일 재선택 허용
      processFiles(files);
    }
  };

  /** 드래그 오버 핸들러 */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  /** 드래그 떠남 핸들러 */
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  /** 드롭 핸들러 - DataTransferItem API로 폴더 재귀 순회 지원 */
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    const collected: { path: string; content: string }[] = [];

    /** FileSystemFileEntry → File 변환 */
    const getFile = (entry: FileSystemFileEntry): Promise<File> =>
      new Promise((resolve, reject) => entry.file(resolve, reject));

    /**
     * readEntries()는 한 번에 최대 100개만 반환하므로
     * 빈 배열이 올 때까지 반복하여 전체 항목을 읽음
     */
    const readAllEntries = async (
      reader: FileSystemDirectoryReader
    ): Promise<FileSystemEntry[]> => {
      const all: FileSystemEntry[] = [];
      let batch: FileSystemEntry[];
      do {
        batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
          reader.readEntries(resolve, reject)
        );
        all.push(...batch);
      } while (batch.length > 0);
      return all;
    };

    /** 파일/폴더 엔트리 재귀 순회 */
    const traverse = async (entry: FileSystemEntry, basePath: string): Promise<void> => {
      if (entry.isFile) {
        const file = await getFile(entry as FileSystemFileEntry);
        if (file.name.endsWith('.clx.js')) {
          const content = await file.text();
          const path = basePath ? `${basePath}/${file.name}` : file.name;
          collected.push({ path, content });
        }
      } else if (entry.isDirectory) {
        const dirPath = basePath ? `${basePath}/${entry.name}` : entry.name;
        const children = await readAllEntries(
          (entry as FileSystemDirectoryEntry).createReader()
        );
        await Promise.all(children.map((child) => traverse(child, dirPath)));
      }
    };

    // 드롭된 모든 항목을 병렬로 처리
    const promises: Promise<void>[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry?.();
      if (entry) promises.push(traverse(entry, ''));
    }
    await Promise.all(promises);

    if (collected.length > 0) addFiles(collected);
  }, [addFiles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>파일 업로드</CardTitle>
        <CardDescription>
          eXBuilder6 프로젝트의 .clx.js 파일을 업로드하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 업로드 방식 선택 버튼 */}
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={() => fileInputRef.current?.click()}>
            <File className="h-3.5 w-3.5" />
            파일 선택
          </Button>
          <Button variant="secondary" size="sm" onClick={() => folderInputRef.current?.click()}>
            <FolderOpen className="h-3.5 w-3.5" />
            폴더 선택
          </Button>
        </div>

        {/* 드래그 앤 드롭 영역 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-all
            ${isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50'
            }
          `}
        >
          <div className="rounded-full bg-muted p-3 mb-3">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            파일 또는 폴더를 드래그 앤 드롭
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            .clx.js 확장자 파일만 처리됩니다
          </p>
        </div>

        {/* 숨김 파일 입력 (멀티파일) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".js"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 숨김 폴더 입력 */}
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory는 표준이 아니지만 대부분의 브라우저에서 지원
          webkitdirectory=""
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
