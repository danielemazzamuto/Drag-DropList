// Project Type
enum ProjectStatus {Active, Finished};
// we use a class to define the structure of the project so we can initialize it with the new keyword
class Project {
  constructor(public id: string, public title: string, public description: string, public people: number, public status: ProjectStatus) {}
}

// Project State Management
type Listener = (items: Project[]) => void;

class ProjectState {
  // This class variable holds the list of listeners
  private listeners: Listener[] = [];
  // This class variable holds the list of projects
  private projects: Project[] = [];
  // This class variable holds the instance of the ProjectState class
  private static instance: ProjectState;

  // The constructor is private to prevent direct instantiation of the class
  private constructor() {}

  // This static method provides access to the singleton instance of the class
  static getInstance() {
    // If an instance of the class already exists, it is returned
    if(this.instance){
      return this.instance;
    }
    // If no instance exists, one is created and then returned
    this.instance = new ProjectState();
    return this.instance;
  }

  // This method adds a listener to the list of listeners
  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn);
  }

  addProject(title: string, description: string, numOfPeople: number){
    const newProject = new Project(Math.random().toString(), title, description, numOfPeople, ProjectStatus.Active)
    this.projects.push(newProject);
    // we loop through the listeners and we call the listenerFn with the updated projects
    // this will trigger the renderProjects method in the ProjectList class
    for (const listenerFn of this.listeners){
      listenerFn(this.projects.slice())
    }
  }
}
// We can now access the singleton instance of the ProjectState class from anywhere in the code
const projectState = ProjectState.getInstance();


// Validation logic
// we create a new interface for the validatable input 
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}
// we create a new function to validate the input with the interface as a parameter
function validate(validatableInput: Validatable) {
  let isValid = true;
  if(validatableInput.required){
    isValid = isValid && validatableInput.value.toString().trim().length != 0;
  }
  if(validatableInput.minLength != null && typeof validatableInput.value === 'string'){
    isValid = isValid && validatableInput.value.toString().length >= validatableInput.minLength;
  }
  if(validatableInput.maxLength != null && typeof validatableInput.value === 'string'){
    isValid = isValid && validatableInput.value.toString().length <= validatableInput.maxLength;
  }
  if(validatableInput.min != null && typeof validatableInput.value === 'number'){
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if(validatableInput.max != null && typeof validatableInput.value === 'number'){
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }
  return isValid;
}

// autobind decorator to bind the this keyword to the method
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const adjustedDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: false,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    }
  };
  return adjustedDescriptor;
}

// ProjectList Class
class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement; 
  element: HTMLElement; // this is the section element
  assignedProjects: Project[];

  // we need to pass the type of the project list when we instantiate the class, as we have two different id css classes
  constructor(private type: 'active' | 'finished'){
    this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement;
    this.hostElement = document.getElementById('app')! as HTMLDivElement;

    // we need to import the content of the template element
    const importedNode = document.importNode(this.templateElement.content, true);
    // access the concrete element of the imported content and store it in the element property
    this.element = importedNode.firstElementChild as HTMLElement; // we know that the first element is a form element
    // we need to set the id of the form element so we can apply styles to it
    this.element.id = `${this.type}-projects`;
    this.assignedProjects = [];

    // we need to add a listener to the projectState
    projectState.addListener((projects: Project[]) => {
      // we filter the projects based on the type of the project list
      if(this.type === 'active'){
        this.assignedProjects = projects.filter(prj => prj.status === ProjectStatus.Active);
      } else {
        this.assignedProjects = projects.filter(prj => prj.status === ProjectStatus.Finished);
      }
      this.renderProjects();
    });

    // we run the attach method to attach the imported content to the host element when the class is instantiated
    this.attach();
    this.renderContent();
  }

  private renderProjects() {
    const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
    // we need to clear the list before rendering the projects to avoid duplicates
    listEl.innerHTML = '';
    for (const prjItem of this.assignedProjects){
      const listItem = document.createElement('li');
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem);
    }
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = `${this.type.toUpperCase()} PROJECTS`;
  }

  private attach() {
    // beforend to add the element as the last child of the host element
    this.hostElement.insertAdjacentElement('beforeend', this.element);
  }
}


// ProjectInput Class
class ProjectInput {
  templateElement: HTMLTemplateElement; 
  hostElement: HTMLDivElement; 
  element: HTMLFormElement; 
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;
  buttonElement: HTMLButtonElement;
  
  constructor() {
    // we need to get the template element and the host element
    this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement;
    this.hostElement = document.getElementById('app')! as HTMLDivElement;

    // we need to import the content of the template element
    const importedNode = document.importNode(this.templateElement.content, true);
    // access the concrete element of the imported content and store it in the element property
    this.element = importedNode.firstElementChild as HTMLFormElement; // we know that the first element is a form element
    // we need to set the id of the form element so we can apply styles to it
    this.element.id = 'user-input';
    // we access the input elements of the form and store them in the corresponding properties
    this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;
    this.buttonElement = this.element.querySelector('button') as HTMLButtonElement;

    // run the configure method to bind the submitHandler to the form element
    this.configure();

    // we run the attach method to attach the imported content to the host element when the class is instantiated
    this.attach();
  }

  // we gather the user input
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    // we need to validate the user input, if we have a false value we return the error message
    if(
      !validate({value: enteredTitle, required: true}) || 
      !validate({value: enteredDescription,required: true, minLength: 5}) || 
      !validate({value: +enteredPeople, required: true, min: 1, max: 5})){
      alert('Invalid input, please try again!');
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  // clear user inputs
  private clearInputs() {
    this.titleInputElement.value = '';
    this.descriptionInputElement.value = '';
    this.peopleInputElement.value = '';
  }

  // run when the form is submitted
  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    // we call gather the user input function
    const userInput = this.gatherUserInput();
    // we need to check if the userInput is an array (tuple) or undefined
    if(Array.isArray(userInput)){
      const [title, desc, people] = userInput;
      // we add the project to the state
      projectState.addProject(title, desc, people);
      this.clearInputs();
    }
  }

  // we listen to the submit event of the form element and we bind the submitHandler to it
  private configure() {
    // we need to bind the submitHandler to the submitHandler method
    this.element.addEventListener('submit', this.submitHandler);
  }

  // we need to attach the imported content to the host element
  private attach() {
    this.hostElement.insertAdjacentElement('afterbegin', this.element);
  }

}

// we instantiate the class and we can see the form in the browser
const prjInput = new ProjectInput();
// we instantiate the class and we can see both sections in the browser
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');
