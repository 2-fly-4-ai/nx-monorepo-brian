import { useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import DecoupledEditor from 'ckeditor5-custom-build/build/ckeditor';
import Image from '@ckeditor/ckeditor5-image/src/image';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSupabase } from '../../hooks/supabase';

interface CKeditorProps {
  onChange: (data: string) => void;
  name: string;
  value: string;
}

const Editor = ({ onChange, value }: CKeditorProps) => {
  const [showEditor, setShowEditor] = useState<boolean>(false);

  if (typeof window !== 'undefined') {
    const balloonPanel = document.querySelector('.ck-balloon-panel');
    {
      balloonPanel &&
        setTimeout(() => {
          balloonPanel.style.visibility = 'visible';
        }, 100);
    }
  }
  const { supabase, error } = useSupabase();

  useEffect(() => {
    // Show the editor once supabase is ready
    setShowEditor(true);
  }, []);

  const handleImageUpload = async (file: File): Promise<string> => {
    // Check if supabase is ready
    if (!supabase) {
      return '';
    }

    const { data, error } = await supabase.storage
      .from('my-bucket')
      .upload(`images/${file.name}`, file, {
        contentType: file.type,
      });

    if (error) {
      console.log('Error uploading image:', error);
      return '';
    }

    return data?.Key || '';
  };

  return showEditor ? (
    <CKEditor
      editor={DecoupledEditor}
      data={value}
      config={{
        placeholder: 'Type here to get started',
        upload: {
          types: ['png', 'jpeg', 'jpg', 'gif', 'webp'],
          // Use a custom upload function that calls handleImageUpload
          handler: async (file) => {
            const uploadedImageUrl = await handleImageUpload(file);
            return { default: uploadedImageUrl };
          },
        },
        codeBlock: {
          languages: [
            { language: 'javascript', label: 'JavaScript' },
            { language: 'python', label: 'Python' },
            { language: 'typescript', label: 'TypeScript' },
            // { language: 'xml', label: 'XML' },
          ],
        },
      }}
      onChange={(event: any, editor: any) => {
        const data = editor.getData();
        onChange(data);
      }}
      onBlur={(event, editor) => {
        console.log('Blur.', editor);
      }}
      onFocus={(event, editor) => {
        console.log('Focus.', editor);
      }}
    />
  ) : (
    <div className="m-auto">Loading...</div>
  );
};

export default Editor;
