import { useEffect, useRef, useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { saveAs } from "file-saver";
import styled from "styled-components";
import contractTemplateService from "../api/services/contractTemplateService";
import type { ContractTemplate } from "../api/types/contractTemplate";
import { extractErrorMessage } from "../api/utils/errorMessage";

interface Props {
  onMessage: (type: "success" | "error", message: string) => void;
}

const ContractTemplatesSettings = ({ onMessage }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [variables, setVariables] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      contractTemplateService.getAll(),
      contractTemplateService.getVariables(),
    ])
      .then(([templateList, variableList]) => {
        if (!active) return;
        setTemplates(templateList);
        setVariables(variableList);
      })
      .catch((error) => {
        if (active) onMessage("error", extractErrorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [onMessage]);

  const upload = async () => {
    if (!file || !name.trim()) {
      onMessage("error", "Укажите название и выберите DOCX-файл");
      return;
    }
    setLoading(true);
    try {
      const template = await contractTemplateService.upload(name.trim(), file);
      setTemplates((current) =>
        [...current, template].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName("");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onMessage("success", "Шаблон договора загружен");
    } catch (error) {
      onMessage("error", extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const remove = async (template: ContractTemplate) => {
    if (!window.confirm(`Удалить шаблон «${template.name}»?`)) return;
    try {
      await contractTemplateService.remove(template.id);
      setTemplates((current) => current.filter((item) => item.id !== template.id));
      onMessage("success", "Шаблон удалён");
    } catch (error) {
      onMessage("error", extractErrorMessage(error));
    }
  };

  const download = async (template: ContractTemplate) => {
    try {
      saveAs(await contractTemplateService.download(template.id), template.fileName);
    } catch (error) {
      onMessage("error", extractErrorMessage(error));
    }
  };

  return (
    <Section>
      <Header>
        <div>
          <h3>Шаблоны договоров</h3>
          <p>Загрузите DOCX и вставьте в него переменные в фигурных скобках.</p>
        </div>
      </Header>

      <UploadRow>
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Название шаблона"
          maxLength={150}
        />
        <FilePicker>
          <Upload size={17} />
          <span>{file?.name ?? "Выбрать DOCX"}</span>
          <input
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </FilePicker>
        <PrimaryButton type="button" disabled={loading} onClick={upload}>
          {loading ? "Загрузка..." : "Загрузить"}
        </PrimaryButton>
      </UploadRow>

      <VariableBox>
        <strong>Переменные</strong>
        <VariableList>
          {variables.map((variable) => (
            <Variable
              key={variable}
              type="button"
              title="Скопировать"
              onClick={() => void navigator.clipboard.writeText(`{${variable}}`)}
            >
              {`{${variable}}`}
            </Variable>
          ))}
        </VariableList>
      </VariableBox>

      <TemplateList>
        {templates.length === 0 ? (
          <Empty>Загруженных шаблонов пока нет</Empty>
        ) : (
          templates.map((template) => (
            <TemplateRow key={template.id}>
              <TemplateInfo>
                <FileText size={21} />
                <div>
                  <strong>{template.name}</strong>
                  <span>{template.fileName}</span>
                </div>
              </TemplateInfo>
              <Actions>
                <IconButton type="button" title="Скачать" onClick={() => void download(template)}>
                  <Download size={18} />
                </IconButton>
                <IconButton $danger type="button" title="Удалить" onClick={() => void remove(template)}>
                  <Trash2 size={18} />
                </IconButton>
              </Actions>
            </TemplateRow>
          ))
        )}
      </TemplateList>
    </Section>
  );
};

const Section = styled.section`
  margin-top: 28px; padding-top: 22px; border-top: 1px solid #edf1f4;
`;
const Header = styled.div`
  h3 { margin: 0 0 5px; color: #172033; font-size: 17px; }
  p { margin: 0; color: #7a8799; font-size: 13px; }
`;
const UploadRow = styled.div`
  display: grid; grid-template-columns: minmax(180px, 1fr) minmax(220px, 1fr) auto;
  gap: 12px; margin-top: 18px;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;
const TextInput = styled.input`
  height: 44px; border: 1px solid #d9e0e7; border-radius: 9px; padding: 0 14px;
  font: inherit; outline: none; box-sizing: border-box;
  &:focus { border-color: #1593a0; box-shadow: 0 0 0 3px rgba(21,147,160,.12); }
`;
const FilePicker = styled.label`
  height: 44px; display: flex; align-items: center; gap: 9px; padding: 0 14px;
  border: 1px dashed #9eabb9; border-radius: 9px; color: #53657b; cursor: pointer;
  overflow: hidden; box-sizing: border-box;
  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  input { display: none; }
`;
const PrimaryButton = styled.button`
  height: 44px; padding: 0 20px; border: 0; border-radius: 9px; color: white;
  background: #168b96; cursor: pointer; font: inherit;
  &:disabled { opacity: .6; cursor: default; }
`;
const VariableBox = styled.div`
  margin-top: 16px; padding: 14px; border-radius: 10px; background: #f8fafb;
  strong { color: #344054; font-size: 13px; }
`;
const VariableList = styled.div`
  display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px;
`;
const Variable = styled.button`
  padding: 5px 8px; border: 1px solid #cfe6e8; border-radius: 6px;
  color: #087b86; background: #eff9f9; cursor: pointer; font-family: monospace;
`;
const TemplateList = styled.div`
  display: flex; flex-direction: column; gap: 10px; margin-top: 16px;
`;
const TemplateRow = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 13px 15px; border: 1px solid #edf1f4; border-radius: 10px;
`;
const TemplateInfo = styled.div`
  display: flex; align-items: center; gap: 11px; min-width: 0; color: #168b96;
  div { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  strong { color: #344054; font-size: 14px; }
  span { color: #98a2b3; font-size: 12px; overflow: hidden; text-overflow: ellipsis; }
`;
const Actions = styled.div`display: flex; gap: 7px;`;
const IconButton = styled.button<{ $danger?: boolean }>`
  width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid #e2e8ee;
  border-radius: 8px; color: ${(p) => p.$danger ? "#e34b4b" : "#53657b"}; background: white; cursor: pointer;
`;
const Empty = styled.div`
  padding: 18px; border: 1px dashed #d9e0e7; border-radius: 10px; color: #98a2b3;
  text-align: center; font-size: 13px;
`;

export default ContractTemplatesSettings;
