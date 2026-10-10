import { createContext, useContext, useEffect, useState } from 'react'
import { API_BASE_URL } from '../lib/api.js'

const CourseContext = createContext({
  courses: [],
  isLoading: true,
  errorMessage: '',
  updateCourse: () => {},
  removeCourse: () => {},
  restoreCourse: () => {},
  addCourseMaterials: () => {},
  updateCourseMaterial: () => {},
  removeCourseMaterial: () => {},
})

function normalizeCourse(course) {
  const materials = Array.isArray(course.materials) ? course.materials : []

  return {
    ...course,
    materials,
    lessons: materials
      .filter((material) => material.mime_type.startsWith('video/'))
      .map((material) => ({
        ...material,
        id: String(material.id),
      })),
  }
}

export function CourseProvider({ children }) {
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadCourses() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/courses`, {
          signal: controller.signal,
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Unable to load courses.')
        }
        if (!Array.isArray(result.courses)) {
          throw new Error('The courses response was not in the expected format.')
        }

        setErrorMessage('')
        setCourses(result.courses.map(normalizeCourse))
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load courses.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadCourses()
    return () => controller.abort()
  }, [refreshVersion])

  function refreshCourses() {
    setRefreshVersion((version) => version + 1)
  }

  function updateCourse(courseId, changes) {
    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        String(course.id) === String(courseId)
          ? normalizeCourse({ ...course, ...changes })
          : course,
      ),
    )
  }

  function removeCourse(courseId) {
    setCourses((currentCourses) =>
      currentCourses.filter((course) => String(course.id) !== String(courseId)),
    )
  }

  function restoreCourse(course, index) {
    setCourses((currentCourses) => {
      if (currentCourses.some((item) => String(item.id) === String(course.id))) {
        return currentCourses
      }

      const restoredCourses = [...currentCourses]
      restoredCourses.splice(index, 0, course)
      return restoredCourses
    })
  }

  function addCourseMaterials(courseId, materials) {
    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        String(course.id) === String(courseId)
          ? normalizeCourse({
              ...course,
              materials: [...course.materials, ...materials],
            })
          : course,
      ),
    )
  }

  function removeCourseMaterial(courseId, materialId) {
    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        String(course.id) === String(courseId)
          ? normalizeCourse({
              ...course,
              materials: course.materials.filter(
                (material) => String(material.id) !== String(materialId),
              ),
            })
          : course,
      ),
    )
  }

  function updateCourseMaterial(courseId, updatedMaterial) {
    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        String(course.id) === String(courseId)
          ? normalizeCourse({
              ...course,
              materials: course.materials.map((material) =>
                String(material.id) === String(updatedMaterial.id)
                  ? updatedMaterial
                  : material,
              ),
            })
          : course,
      ),
    )
  }

  return (
    <CourseContext.Provider
      value={{
        courses,
        isLoading,
        errorMessage,
        refreshCourses,
        updateCourse,
        removeCourse,
        restoreCourse,
        addCourseMaterials,
        updateCourseMaterial,
        removeCourseMaterial,
      }}
    >
      {children}
    </CourseContext.Provider>
  )
}

// Context hooks are intentionally exported with their provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useCourseCatalog() {
  return useContext(CourseContext)
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCourses() {
  return useCourseCatalog().courses
}
