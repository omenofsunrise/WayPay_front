import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import TitleField from '../ui/Layouts/TitleLayout';
import CustomTitle from '../ui/Text/CustomTitle';
import ModalInfoTitle from '../ui/Text/ModalInfoTitle';
import CustomInput from '../ui/fields/CustomInput';
import ViewButton from '../ui/Buttons/ViewButton';
import AddButtonImage from '../../assets/ui/buttons/AddButton.svg';  
import CustomTable from '../ui/tables/CustomTable';
import useNotes from '../../api/hooks/useNote';
import { formatDate } from '../../utils/dateFormatter';

interface ViewCreditModalProps {
  id: string | number;
  isOpen: boolean;
  onClose: () => void;
}

const ViewCreditModal: React.FC<ViewCreditModalProps> = ({
  id,
  isOpen,
  onClose,
}) => {
  const { notes, isLoading, error, getNotes, createNote, deleteNote } = useNotes();
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && id) {
      getNotes(Number(id));
    }
  }, [isOpen, id, getNotes]);

  const notesColumns = [
    { name: 'Дата' },
    { name: 'Заметка', align: 'left' as const },
    { name: '' }
  ];

  const handleDeleteNote = async (noteId: number) => {
    await deleteNote(noteId);
    getNotes(Number(id));
  };

  const formatNotesData = () => {
    return notes.map(note => [
      formatDate(note.createdAt),
      note.content,
      <DeleteIcon 
        key={note.id} 
        onClick={() => handleDeleteNote(note.id)}
      >
        <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.97271 16.8889C2.97271 18.05 4.01965 19 5.29924 19H14.6054C15.885 19 16.9319 18.05 16.9319 16.8889V4.22222H2.97271V16.8889ZM18.0952 1.05556H14.0237L12.8605 0H7.04414L5.88088 1.05556H1.80945V3.16667H18.0952V1.05556Z" fill="#50555C"/>
        </svg>
      </DeleteIcon>
    ]);
  };

  const handleAddNoteClick = () => {
    setIsNoteModalOpen(true);
  };

  const handleCreateNote = async () => {
    if (newNoteContent.trim()) {
      await createNote({
        creditId: Number(id),
        content: newNoteContent
      });
      setNewNoteContent('');
      setIsNoteModalOpen(false);
      getNotes(Number(id));
    }
  };

  const handleCancelNote = () => {
    setNewNoteContent('');
    setIsNoteModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay isOpen={isOpen} onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalWrapper>
            <CloseButton onClick={onClose}>&times;</CloseButton>
            <TitleField style={{ marginTop: "0" }}>
              <CustomTitle>Договор №{id}</CustomTitle>
            </TitleField>
            <HorizontalContainer>
                <VerticalContainer>
                    <ModalInfoTitle>Общая информация</ModalInfoTitle>
                    <HorizontalContainer>
                        <InputContainer style={{ maxWidth: "189px", paddingRight: "20px"}}>
                            <InputTitle>Дата</InputTitle>
                            <CustomInput />
                        </InputContainer>
                        <InputContainer style={{ width: "260px"}}>
                            <InputTitle>Инвестор</InputTitle>
                            <CustomInput />
                        </InputContainer>
                        <ViewButtonContainer>
                            <ViewButton />
                        </ViewButtonContainer>
                    </HorizontalContainer>
                    <ModalInfoTitle style={{ marginTop: "30px" }}>Сведения о покупателе</ModalInfoTitle>
                    <HorizontalContainer>
                        <InputContainer style={{ width: "260px"}}>
                            <InputTitle>Покупатель</InputTitle>
                            <CustomInput />
                        </InputContainer>
                        <ViewButtonContainer>
                            <ViewButton />
                        </ViewButtonContainer>
                        <InputContainer style={{ maxWidth: "189px", paddingLeft: "20px"}}>
                            <InputTitle>Первоначальный взнос, руб</InputTitle>
                            <CustomInput />
                        </InputContainer>
                    </HorizontalContainer>
                    <HorizontalContainer style={{ marginTop: "10px"}}>
                        <InputContainer style={{ width: "260px"}}>
                            <InputTitle>Поручитель</InputTitle>
                            <CustomInput />
                        </InputContainer>
                        <ViewButtonContainer>
                            <ViewButton />
                        </ViewButtonContainer>
                        <InputContainer style={{ maxWidth: "189px", paddingLeft: "20px"}}>
                            <InputTitle>Срок, месяцев</InputTitle>
                            <CustomInput />
                        </InputContainer>
                    </HorizontalContainer>
                </VerticalContainer>
                <VerticalContainer style={{ marginLeft: "30px", width: "562px" }}>
                    <HorizontalContainer style={{ alignItems: "center", marginBottom: "15px" }}>
                        <ModalInfoTitle>Заметки</ModalInfoTitle>
                        <AddButton src={AddButtonImage} alt="Add Button" onClick={handleAddNoteClick} />
                    </HorizontalContainer>
                    <TableContainer style={{ width: "562px", maxHeight: "260px" }}>
                      {isLoading ? (
                        <LoadingText>Загрузка заметок...</LoadingText>
                      ) : error ? (
                        <ErrorText>{error}</ErrorText>
                      ) : (
                        <Table 
                          columns={notesColumns} 
                          data={formatNotesData()}
                        />
                      )}
                    </TableContainer>
                </VerticalContainer>
            </HorizontalContainer>
          </ModalWrapper>
        </ModalContent>
      </ModalOverlay>

      <ModalOverlay isOpen={isNoteModalOpen} onClick={handleCancelNote}>
        <NoteModalContent onClick={(e) => e.stopPropagation()}>
          <NoteModalWrapper>
            <CustomTitle style={{ marginTop: 0 }}>Заметка</CustomTitle>
            <NoteInput 
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Введите текст заметки..."
            />
            <ButtonContainer>
              <CancelButton onClick={handleCancelNote}>Отменить</CancelButton>
              <CreateButton onClick={handleCreateNote}>Создать</CreateButton>
            </ButtonContainer>
          </NoteModalWrapper>
        </NoteModalContent>
      </ModalOverlay>
    </>
  );
};

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: black;
`;

const ModalWrapper = styled.div`
  margin: 40px;
`;

const VerticalContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const HorizontalContainer = styled.div`
    display: flex;
    flex-direction: row;
`;

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 1232px;
  overflow-y: auto;
`;

const InputTitle = styled.h5`
    font-size: 14px;
    text-align: left;
    font-weight: 400;
    margin: 0;
    margin-bottom: 10px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
`;

const ViewButtonContainer = styled.div`
    margin-top: 40px;
`;

const AddButton = styled.img`
  cursor: pointer;
  margin-left: auto;

  &:hover {
    opacity: 0.8;
  }
`;

const TableContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 260px;
  overflow-y: auto;
  width: 100%;
  height: 100%;
`;

const LoadingText = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
`;

const ErrorText = styled.div`
  padding: 20px;
  text-align: center;
  color: #ff0000;
`;

const NoteModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 500px;
`;

const NoteModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 20px;
`;

const NoteInput = styled.textarea`
  width: auto;
  height: 150px;
  padding: 12px;
  margin: 15px 0;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  resize: none;
  font-family: inherit;
  font-size: 14px;

  &:focus {
    outline: none;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const CancelButton = styled.button`
  padding: 8px 16px;
  background: rgba(209, 213, 219, 1);
  border-radius: 10px;
  cursor: pointer;
  margin-right: auto;

  &:hover {
    background: #e6e6e6;
  }
`;

const CreateButton = styled.button`
  padding: 8px 16px;
  background: rgba(0, 125, 136, 1);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  
  &:hover {
    background: rgba(0, 125, 116, 1);
  }
`;

const DeleteIcon = styled.div`
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    opacity: 0.7;
  }
`;

const Table = styled(CustomTable)`
  max-height: 260px;
  height: 100%;
`;

export default ViewCreditModal;