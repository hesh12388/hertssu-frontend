import { useAuth } from '@/App';
import { TaskType, formatPriority, getAssigneeName, getAssignerName, getPriorityColor, getStatusColor } from '@/src/types/Task';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NavBar from '../../components/Navbar';
import { StatusMessage } from '../../components/StatusMessage';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailsModal from './TaskDetailsModal';

const Tasks = () => {
    const [showMyTasks, setShowMyTasks] = useState(true);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    const auth = useAuth();
    
    const [myTasks, setMyTasks] = useState<TaskType[]>([]);
    const [assignedByMeTasks, setAssignedByMeTasks] = useState<TaskType[]>([]);
    const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
    const [showTaskDetails, setShowTaskDetails] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setIsLoading(true);
            setShowStatus(true);
            setStatusMessage("Fetching your tasks...");
            
            // Fetch both "assigned to me" and "assigned by me" tasks
            const [myTasksResponse, assignedByMeResponse] = await Promise.all([
                auth?.api.get('/tasks/assigned-to-me'),
                auth?.api.get('/tasks/assigned-by-me')
            ]);
            
            setMyTasks(myTasksResponse?.data || []);
            setAssignedByMeTasks(assignedByMeResponse?.data || []);
            setIsSuccess(true);
            setIsLoading(false);
            setResultMessage("Successfully fetched your tasks!");
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setIsSuccess(false);
            setIsLoading(false);
            setResultMessage("Error fetching your tasks!");
        } finally {
            setTimeout(() => {
                setShowStatus(false);
            }, 2500);
        }
    };

    const getFilteredTasks = (status: string) => {
        const currentTasks = showMyTasks ? myTasks : assignedByMeTasks;
        return currentTasks.filter(task => task.status === status);
    };

    const confirmDeleteTask = (task: TaskType) => {
        Alert.alert(
            "Delete Task",
            `Are you sure you want to delete "${task.title}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteTask(task.id)
                }
            ]
        );
    };

    const deleteTask = async (taskId: number) => {
        try {
            setIsLoading(true);
            setShowStatus(true);
            setStatusMessage("Deleting task...");

            await auth?.api.delete(`/tasks/${taskId}`);
            
            
            setAssignedByMeTasks(prev => prev.filter(task => task.id !== taskId));
            
            setIsLoading(false);
            setIsSuccess(true);
            setResultMessage("Task deleted successfully!");
        } catch (error) {
            console.error('Error deleting task:', error);
            setIsLoading(false);
            setIsSuccess(false);
            setResultMessage("Error deleting task!");
        } finally {
            setTimeout(() => {
                setShowStatus(false);
            }, 2500);
        }
    };

    const handleCreateTask = () => {
        setIsCreateModalVisible(true);
    };

    const formatDueDate = (dueDateString: string) => {
        const date = new Date(dueDateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return {
                text: `${Math.abs(diffDays)} days overdue`,
                color: '#F44336'
            };
        } else if (diffDays === 0) {
            return {
                text: 'Due today',
                color: '#FF9800'
            };
        } else if (diffDays === 1) {
            return {
                text: 'Due tomorrow',
                color: '#FF9800'
            };
        } else {
            return {
                text: `Due in ${diffDays} days`,
                color: '#666'
            };
        }
    };

    const openTaskDetails = (task: TaskType) => {
        setSelectedTask(task);
        setShowTaskDetails(true);
    };

    const renderTaskItem = ({ item }: { item: TaskType }) => {
        const dueInfo = formatDueDate(item.dueDate);
        const canDelete = !showMyTasks && item.status !== 'COMPLETED';

        return (
            <TouchableOpacity 
                style={styles.taskCard}
                onPress={() => openTaskDetails(item)}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                        <Text style={styles.priorityText}>{formatPriority(item.priority)}</Text>
                    </View>
                </View>
                
                <Text style={styles.taskDescription} numberOfLines={2}>{item.description}</Text>
                
                <View style={styles.taskMeta}>
                    <Text style={styles.assignmentText}>
                        {showMyTasks ? `From: ${getAssignerName(item)}` : `To: ${getAssigneeName(item)}`}
                    </Text>
                </View>
                
                <View style={styles.cardFooter}>
                   
                    {item.status === 'COMPLETED' ? (
                        <View style={styles.dueDateContainer}>
                            <Ionicons name="checkmark-circle" size={16} color="green" />
                            <Text style={[styles.dueDateText, { color: "green" }]}>
                                Submitted
                            </Text>
                        </View>
                    ): 
                    (
                        <View style={styles.dueDateContainer}>
                            <Ionicons name="time-outline" size={16} color={dueInfo.color} />
                            <Text style={[styles.dueDateText, { color: dueInfo.color }]}>
                                {dueInfo.text}
                            </Text>
                        </View>
                    )}
                    
                    {canDelete && (
                        <TouchableOpacity 
                            onPress={(e) => {
                                e.stopPropagation();
                                confirmDeleteTask(item);
                            }}
                        >
                            <Ionicons name="trash-outline" size={24} color="#ff4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderTaskSection = (status: string, title: string) => {
        const tasks = getFilteredTasks(status);
        
        return (
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                        <Text style={styles.statusText}>{tasks.length}</Text>
                    </View>
                </View>
                
                {tasks.length === 0 ? (
                    <View style={styles.emptySection}>
                        <Text style={styles.emptyText}>No {title.toLowerCase()} tasks</Text>
                    </View>
                ) : (
                    <FlatList
                        data={tasks}
                        renderItem={renderTaskItem}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <NavBar />
                <View style={styles.header}>
                    <Text style={styles.headerText}>
                        {showMyTasks ? "My Tasks" : "Assigned By Me"}
                    </Text>
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={handleCreateTask}>
                            <Ionicons name="add-circle-outline" size={34} color='#E9435E' />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tab Toggle */}
                <View style={styles.tabContainer}>
                    <View style={styles.tabToggle}>
                        <TouchableOpacity 
                            onPress={() => setShowMyTasks(true)} 
                            style={[styles.tabButton, showMyTasks && styles.activeTabButton]}
                        >
                            <Text style={[styles.tabText, showMyTasks && styles.activeTabText]}>My Tasks</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setShowMyTasks(false)} 
                            style={[styles.tabButton, !showMyTasks && styles.activeTabButton]}
                        >
                            <Text style={[styles.tabText, !showMyTasks && styles.activeTabText]}>Assigned By Me</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Task Sections */}
                <View style={styles.tasksContainer}>
                    {renderTaskSection('IN_PROGRESS', 'In Progress')}
                    {renderTaskSection('PENDING_REVIEW', 'Pending Review')}
                    {renderTaskSection('COMPLETED', 'Completed')}
                </View>
            </ScrollView>

            {showStatus && !isCreateModalVisible && (
                <View style={styles.statusOverlay}>
                    <StatusMessage 
                        isLoading={isLoading}
                        isSuccess={isSuccess}
                        loadingMessage={statusMessage}
                        resultMessage={resultMessage}
                    />
                </View>
            )}

            <CreateTaskModal 
                visible={isCreateModalVisible}
                onClose={() => setIsCreateModalVisible(false)} 
                onUpdate={(newTask: TaskType) => {      
                    setAssignedByMeTasks(prev => [newTask, ...prev]);
                }}
            />
            
            <TaskDetailsModal 
                visible={showTaskDetails}
                selectedTask={selectedTask}
                onClose={() => setShowTaskDetails(false)} 
                onUpdate={(updatedTask: TaskType) => {      
                    setMyTasks(prev => 
                        prev.map(task => task.id === updatedTask.id ? updatedTask : task)
                    );
                    setAssignedByMeTasks(prev => 
                        prev.map(task => task.id === updatedTask.id ? updatedTask : task)
                    );
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1,
    },
    statusOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 1000, 
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    tabContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    tabToggle: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTabButton: {
        backgroundColor: '#E9435E',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '600',
    },
    tasksContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 12,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'white',
    },
    taskDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        lineHeight: 20,
    },
    taskMeta: {
        marginBottom: 8,
    },
    assignmentText: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dueDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dueDateText: {
        fontSize: 12,
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 4,
    },
    emptySection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});

export default Tasks;