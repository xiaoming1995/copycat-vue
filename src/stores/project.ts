import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
    getProjects,
    createProject as apiCreateProject,
    deleteProject as apiDeleteProject,
    updateProject as apiUpdateProject,
    batchDeleteProjects as apiBatchDeleteProjects,
    type Project,
    type CreateProjectRequest,
    type UpdateProjectRequest
} from '../services/project'

export type { Project, ProjectStatus } from '../services/project'

export const useProjectStore = defineStore('project', () => {
    // 项目列表
    const projects = ref<Project[]>([])

    // 分页信息
    const pagination = ref({
        total: 0,
        page: 1,
        pageSize: 10
    })

    // 加载状态
    const isLoading = ref(false)

    /**
     * 获取项目列表
     */
    async function fetchProjects(page = 1, pageSize = 10): Promise<boolean> {
        isLoading.value = true
        try {
            const response = await getProjects(page, pageSize)

            if (response.code === 0 && response.data) {
                projects.value = response.data.list
                pagination.value = {
                    total: response.data.total,
                    page: response.data.page,
                    pageSize: response.data.page_size
                }
                return true
            }

            return false
        } catch (error) {
            console.error('获取项目列表失败:', error)
            return false
        } finally {
            isLoading.value = false
        }
    }

    /**
     * 创建项目
     */
    async function createProject(data: CreateProjectRequest): Promise<{ success: boolean; project?: Project; message: string }> {
        try {
            const response = await apiCreateProject(data)

            if (response.code === 0 && response.data) {
                // 添加到列表开头
                projects.value.unshift(response.data)
                pagination.value.total++
                return { success: true, project: response.data, message: '项目创建成功' }
            }

            return { success: false, message: response.msg || '创建失败' }
        } catch (error) {
            console.error('创建项目失败:', error)
            return { success: false, message: '网络错误，请稍后重试' }
        }
    }

    /**
     * 更新项目
     */
    async function updateProject(id: string, data: UpdateProjectRequest): Promise<{ success: boolean; message: string }> {
        try {
            const response = await apiUpdateProject(id, data)

            if (response.code === 0 && response.data) {
                // 更新本地列表
                const index = projects.value.findIndex(p => p.id === id)
                if (index !== -1) {
                    projects.value[index] = response.data
                }
                return { success: true, message: '项目更新成功' }
            }

            return { success: false, message: response.msg || '更新失败' }
        } catch (error) {
            console.error('更新项目失败:', error)
            return { success: false, message: '网络错误，请稍后重试' }
        }
    }

    /**
     * 删除项目
     */
    async function deleteProject(id: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await apiDeleteProject(id)

            if (response.code === 0) {
                // 从本地列表移除
                projects.value = projects.value.filter(p => p.id !== id)
                pagination.value.total--
                return { success: true, message: '项目删除成功' }
            }

            return { success: false, message: response.msg || '删除失败' }
        } catch (error) {
            console.error('删除项目失败:', error)
            return { success: false, message: '网络错误，请稍后重试' }
        }
    }

    /**
     * 清空本地项目列表
     */
    function clearProjects() {
        projects.value = []
        pagination.value = { total: 0, page: 1, pageSize: 10 }
    }

    /**
     * 批量删除项目
     */
    async function batchDeleteProjects(ids: string[]): Promise<{ success: boolean; deletedCount: number; message: string }> {
        try {
            const response = await apiBatchDeleteProjects(ids)

            if (response.code === 0 && response.data) {
                // 从本地列表中移除已删除的项目
                projects.value = projects.value.filter(p => !ids.includes(p.id))
                pagination.value.total -= response.data.deleted_count
                return { success: true, deletedCount: response.data.deleted_count, message: '批量删除成功' }
            }

            return { success: false, deletedCount: 0, message: response.msg || '批量删除失败' }
        } catch (error) {
            console.error('批量删除项目失败:', error)
            return { success: false, deletedCount: 0, message: '网络错误，请稍后重试' }
        }
    }

    return {
        projects,
        pagination,
        isLoading,
        fetchProjects,
        createProject,
        updateProject,
        deleteProject,
        batchDeleteProjects,
        clearProjects
    }
})
