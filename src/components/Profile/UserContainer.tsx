import styled from "styled-components";
import { useState, useRef, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import EmployeeModal from "../modal/CrudInherited/EmployeeModal";
import { useEmployee } from "../../api/hooks/useEmployee";
import { FILE_BASE_URL } from "../../api/client";
import { getInitials, generateAvatar } from "../../utils/avatarUtils";
import type { Employee } from "../../api/types/employee";

interface UserContainerProps {
    employee?: Employee;
    isCurrentUser?: boolean;
    allowEdit?: boolean;
}

const UserContainer = ({ employee: propEmployee, isCurrentUser = true, allowEdit = true }: UserContainerProps) => {
    const { authInfo, loading, error, updateEmployee, updateEmployeePhoto, refresh, deletePhoto } = useEmployee();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [isViewingPhoto, setIsViewingPhoto] = useState(false);
    const [isDefaultAvatar, setIsDefaultAvatar] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarRef = useRef<HTMLImageElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<number | null>(null);
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
    const employee = propEmployee;
    
    useEffect(() => {
        if (employee?.photoPath) {
            setIsDefaultAvatar(false);
        } else {
            setIsDefaultAvatar(true);
        }
    }, [employee?.photoPath]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setIsContextMenuOpen(false);
            }
        };

        if (isContextMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isContextMenuOpen]);

    const handleEditClick = () => {
        if (!allowEdit) return;
        setIsModalOpen(true);
    };

    const handleModalClose = async () => {
        let result = await refresh();
        if (employee) employee.photoPath = result.employee.photoPath;
        setIsModalOpen(false);
    };

    const handleModalSubmit = async (updatedData: {
        fullName: string;
        address: string;
        role: string;
        phone: string;
        minSurcharge: number;
    }) => {        
        if (!employee?.id) return;
        
        try {
            const result = await updateEmployee({
                id: employee.id,
                fullName: updatedData.fullName,
                address: updatedData.address,
                phone: updatedData.phone,
            });
            if (employee) {
                employee.fullName = result.fullName;
                employee.address = result.address;
            }
            setIsModalOpen(false);
            await refresh();
        } catch (err) {
            console.error("Failed to update employee:", err);
        }
    };

    const handleAvatarInteraction = (e: React.MouseEvent) => {
        if (!isCurrentUser) return;
        
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        
        const rect = avatarRef.current?.getBoundingClientRect();
        if (rect) {
            setContextMenuPosition({
                x: e.clientX,
                y: e.clientY + 10
            });
            setIsContextMenuOpen(prev => !prev);
        }
    };

    const handleAvatarMouseEnter = (e: React.MouseEvent) => {
        if (!isCurrentUser || isMobile) return;
        handleAvatarInteraction(e);
    };

    const handleAvatarMouseLeave = () => {
        if (!isCurrentUser || isMobile) return;
        
        hoverTimeoutRef.current = window.setTimeout(() => {
            setIsContextMenuOpen(false);
        }, 100);
    };

    const handleAvatarClick = (e: React.MouseEvent) => {
        if (!isCurrentUser) {
            if (!isDefaultAvatar) {
                setIsViewingPhoto(true);
            }
            return;
        }
        
        if (isMobile) {
            handleAvatarInteraction(e);
        }
    };

    const handleContextMenuMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const handleContextMenuMouseLeave = () => {
        if (isMobile) return;
        setIsContextMenuOpen(false);
    };

    const handleContextMenuAction = (action: 'view' | 'change' | 'remove') => {
        setIsContextMenuOpen(false);
        
        if (action === 'view' && !isDefaultAvatar) {
            setIsViewingPhoto(true);
        } else if (action === 'change' && fileInputRef.current) {
            fileInputRef.current.click();
        } else if (action === 'remove' && employee?.id && isCurrentUser) {
            deletePhoto().then(() => {
                setIsDefaultAvatar(true);
            });
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!employee?.id || !isCurrentUser) return;
        
        if (e.target.files && e.target.files.length > 0) {
            try {
                let result = await updateEmployeePhoto(employee.id, e.target.files[0]);
                if (employee) employee.photoPath = result.photoPath;
                setIsDefaultAvatar(false);
            } catch (err) {
                console.error("Failed to update photo:", err);
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };
    
    if (loading && !propEmployee) {
        return <Container>Loading...</Container>;
    }

    if ((error || !employee) && !propEmployee) {
        return <Container>Error: {error || "Employee data not available"}</Container>;
    }

    if (!employee) {
        return <Container>No employee data</Container>;
    }
    
    const avatarSrc = employee?.photoPath 
        ? `${FILE_BASE_URL}${employee.photoPath}?${Date.now()}`
        : generateAvatar(getInitials(employee?.fullName || ''), 100);
        
    return (
        <>
            <Container>
                {allowEdit && (
                    <EditIcon onClick={handleEditClick}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 17.2498V20.9998H6.75L17.81 9.93984L14.06 6.18984L3 17.2498ZM21.41 6.33984L17.66 2.58984L15.13 5.12984L18.88 8.87984L21.41 6.33984Z" fill="#50555C"/>
                        </svg>
                    </EditIcon>
                )}
                
                {isCurrentUser && (
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                )}
                
                <ProfileImage 
                    ref={avatarRef}
                    src={avatarSrc} 
                    alt={employee.fullName} 
                    onMouseEnter={handleAvatarMouseEnter}
                    onMouseLeave={handleAvatarMouseLeave}
                    onClick={handleAvatarClick}
                    onError={(e) => {
                        e.currentTarget.src = generateAvatar(getInitials(employee.fullName), 100);
                        setIsDefaultAvatar(true);
                    }}
                    data-is-default={isDefaultAvatar}
                />
                
                {isContextMenuOpen && isCurrentUser && (
                    <ContextMenu 
                        ref={contextMenuRef}
                        style={{
                            left: `${contextMenuPosition.x}px`,
                            top: `${contextMenuPosition.y}px`,
                            position: 'fixed'
                        }}
                        onMouseEnter={handleContextMenuMouseEnter}
                        onMouseLeave={handleContextMenuMouseLeave}
                    >
                        {!isDefaultAvatar && (
                            <ContextMenuItem onClick={() => handleContextMenuAction('view')}>
                                Просмотреть фото
                            </ContextMenuItem>
                        )}
                        <ContextMenuItem onClick={() => handleContextMenuAction('change')}>
                            {isDefaultAvatar ? "Добавить фото" : "Изменить фото"} 
                        </ContextMenuItem>
                        {!isDefaultAvatar && (
                            <ContextMenuItem onClick={() => handleContextMenuAction('remove')}>
                                Удалить фото
                            </ContextMenuItem>
                        )}
                    </ContextMenu>
                )}
                
                <ProfileName>{employee.fullName}</ProfileName>
                <ProfileInfo>
                    {employee.role}
                </ProfileInfo>
                
                <ContactInfo>
                    <ContactItem>
                        <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.8262 13.3525L14.6037 13.0988C14.3424 13.0681 14.0775 13.097 13.829 13.1834C13.5804 13.2698 13.3547 13.4114 13.1687 13.5975L11.5587 15.2075C9.07494 13.944 7.05603 11.9251 5.79247 9.44129L7.41122 7.82254C7.78747 7.44629 7.97122 6.92129 7.90997 6.38754L7.65622 4.18254C7.6068 3.75562 7.40201 3.36181 7.08088 3.07619C6.75975 2.79056 6.34475 2.63309 5.91497 2.63379H4.40122C3.41247 2.63379 2.58997 3.45629 2.65122 4.44504C3.11497 11.9175 9.09122 17.885 16.555 18.3488C17.5437 18.41 18.3662 17.5875 18.3662 16.5988V15.085C18.375 14.2013 17.71 13.4575 16.8262 13.3525Z" fill="#50555C"/>
                        </svg>
                        {employee.phone}
                    </ContactItem>
                    <ContactItem>
                        <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10.5 10.0625C9.91984 10.0625 9.36344 9.83203 8.9532 9.42179C8.54297 9.01156 8.3125 8.45516 8.3125 7.875C8.3125 7.29484 8.54297 6.73844 8.9532 6.3282C9.36344 5.91797 9.91984 5.6875 10.5 5.6875C11.0802 5.6875 11.6366 5.91797 12.0468 6.3282C12.457 6.73844 12.6875 7.29484 12.6875 7.875C12.6875 8.16227 12.6309 8.44672 12.521 8.71212C12.4111 8.97752 12.2499 9.21867 12.0468 9.42179C11.8437 9.62492 11.6025 9.78605 11.3371 9.89599C11.0717 10.0059 10.7873 10.0625 10.5 10.0625ZM10.5 1.75C8.87555 1.75 7.31763 2.39531 6.16897 3.54397C5.02031 4.69263 4.375 6.25055 4.375 7.875C4.375 12.4687 10.5 19.25 10.5 19.25C10.5 19.25 16.625 12.4687 16.625 7.875C16.625 6.25055 15.9797 4.69263 14.831 3.54397C13.6824 2.39531 12.1245 1.75 10.5 1.75Z" fill="#50555C"/>
                        </svg>
                        {employee.address || 'Не указан'}
                    </ContactItem>
                    <ContactItem>
                        <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18.9963 6.37894C18.9149 6.29693 18.8181 6.23183 18.7115 6.18741C18.6049 6.14299 18.4905 6.12012 18.375 6.12012C18.2595 6.12012 18.1451 6.14299 18.0385 6.18741C17.9319 6.23183 17.8351 6.29693 17.7538 6.37894L12.25 11.8914L8.49626 8.12894C8.41492 8.04693 8.31814 7.98183 8.21151 7.93741C8.10489 7.89299 7.99052 7.87012 7.87501 7.87012C7.7595 7.87012 7.64513 7.89299 7.5385 7.93741C7.43188 7.98183 7.3351 8.04693 7.25376 8.12894L2.00376 13.3789C1.92175 13.4603 1.85665 13.5571 1.81223 13.6637C1.76781 13.7703 1.74493 13.8847 1.74493 14.0002C1.74493 14.1157 1.76781 14.2301 1.81223 14.3367C1.85665 14.4433 1.92175 14.5401 2.00376 14.6214C2.0851 14.7035 2.18188 14.7685 2.2885 14.813C2.39513 14.8574 2.5095 14.8803 2.62501 14.8803C2.74052 14.8803 2.85489 14.8574 2.96151 14.813C3.06814 14.7685 3.16492 14.7035 3.24626 14.6214L7.87501 9.98394L11.6288 13.7464C11.7101 13.8285 11.8069 13.8935 11.9135 13.938C12.0201 13.9824 12.1345 14.0053 12.25 14.0053C12.3655 14.0053 12.4799 13.9824 12.5865 13.938C12.6931 13.8935 12.7899 13.8285 12.8713 13.7464L18.9963 7.62144C19.0783 7.5401 19.1434 7.44332 19.1878 7.3367C19.2322 7.23007 19.2551 7.1157 19.2551 7.00019C19.2551 6.88468 19.2322 6.77031 19.1878 6.66369C19.1434 6.55706 19.0783 6.46028 18.9963 6.37894Z" fill="#50555C"/>
                        </svg>
                        Мин. надбавка {employee.minSurcharge}%
                    </ContactItem>
                </ContactInfo>
            </Container>

            {(
                <EmployeeModal
                    mode="edit"
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    onSubmit={handleModalSubmit}
                    initialData={{
                        fullName: employee.fullName,
                        address: employee.address || '',
                        role: employee.role,
                        phone: employee.phone,
                        minSurcharge: employee.minSurcharge,
                        avatar: employee.photoPath,
                        id: employee.id,
                    }}
                />
            )}

            {isViewingPhoto && (
                <PhotoModal onClick={() => setIsViewingPhoto(false)}>
                    <PhotoModalContent>
                        <img 
                            src={avatarSrc} 
                            alt={employee.fullName}
                            onError={(e) => {
                                e.currentTarget.src = generateAvatar(getInitials(employee.fullName), 100);
                            }}
                        />
                    </PhotoModalContent>
                </PhotoModal>
            )}
        </>
    );
}

const Container = styled.div`
    background-color: white;
    border-radius: 10px;
    border: 1px solid rgba(209, 213, 219, 1);
    width: auto;
    padding: 30px;
    position: relative;
    flex: 1;
`;

const EditIcon = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    
    &:hover {
        opacity: 0.8;
    }
`;

const ProfileImage = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto;
  display: block;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const ProfileName = styled.h2`
  text-align: center;
  color: #333;
  font-size: 18px;
  margin: 10px 0 0;
`;

const ProfileInfo = styled.p`
  text-align: center;
  color: #666;
  font-size: 15px;
  margin: 0 0 10px;
`;

const ContactInfo = styled.div`
    margin-top: 15px;
    padding-top: 10px;
`;

const ContactItem = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #50555C;
    font-size: 15px;
    margin-bottom: 8px;
    
    svg {
        flex-shrink: 0;
    }
`;

const ContextMenu = styled.div`
    position: fixed;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    min-width: 150px;
    color: black;
`;

const ContextMenuItem = styled.div`
    padding: 8px 16px;
    cursor: pointer;
    
    &:hover {
        background-color: #f5f5f5;
    }
`;

const PhotoModal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    cursor: pointer;
`;

const PhotoModalContent = styled.div`
    max-width: 90%;
    max-height: 90%;
    
    img {
        max-width: 100%;
        max-height: 90vh;
        border-radius: 8px;
    }
`;

export default UserContainer;