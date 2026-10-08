import { createContext, useContext } from 'react'

const courses = [
  {
    id: 'react-foundations',
    title: 'React Foundations',
    instructor: 'Maya Chen',
    description:
      'Build a strong foundation in modern React, from components and props through state and effects.',
    lessons: [
      { id: 'getting-started', title: 'Getting started with React' },
      { id: 'components-props', title: 'Components and props' },
      { id: 'state-events', title: 'State and events' },
    ],
  },
  {
    id: 'web-accessibility',
    title: 'Practical Web Accessibility',
    instructor: 'Jordan Rivera',
    description:
      'Learn practical techniques for building inclusive interfaces that work for more people.',
    lessons: [
      { id: 'accessibility-basics', title: 'Accessibility basics' },
      { id: 'semantic-html', title: 'Semantic HTML' },
      { id: 'keyboard-testing', title: 'Keyboard testing' },
    ],
  },
]

const CourseContext = createContext(courses)

export function CourseProvider({ children }) {
  return (
    <CourseContext.Provider value={courses}>{children}</CourseContext.Provider>
  )
}

// Context hooks are intentionally exported with their provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useCourses() {
  return useContext(CourseContext)
}