// Drag & Drop Interfaces
interface Draggable {
  // DragEvent is a built-in type in TypeScript that represents the event object for drag events
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}
// DragTarget represents the box where we can drop the draggable element
interface DragTarget {
  // dragOverHandler is called when the draggable element is over the drop zone - will pwemit the drop event
  dragOverHandler(event: DragEvent): void;
  // dropHandler is called when the draggable element is dropped in the drop zone
  dropHandler(event: DragEvent): void;
  // dragLeaveHandler is called when the draggable element leaves the drop zone
  dragLeaveHandler(event: DragEvent): void;
}

// Project Type
enum ProjectStatus {Active, Finished};

// we use a class to define the structure of the project so we can initialize it with the new keyword
class Project {
  constructor(public id: string, public title: string, public description: string, public people: number, public status: ProjectStatus) {}
}


// Project State Management
// we define a generic type for the listener function
type Listener<T> = (items: T[]) => void;

class State<T> {
  // This class variable holds the list of listeners
  protected listeners: Listener<T>[] = [];
  // This method adds a listener to the list of listeners
  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

class ProjectState extends State<Project>{
  
  // This class variable holds the list of projects
  private projects: Project[] = [];
  // This class variable holds the instance of the ProjectState class
  private static instance: ProjectState;

  // The constructor is private to prevent direct instantiation of the class
  private constructor() {
    super();
  }

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

  addProject(title: string, description: string, numOfPeople: number){
    const newProject = new Project(Math.random().toString(), title, description, numOfPeople, ProjectStatus.Active)
    this.projects.push(newProject);
    // we loop through the listeners and we call the listenerFn with the updated projects
    // we need to update the listeners when we add or move a project
    this.updateListeners();
  }

  moveProject(projectId: string, newStatus: ProjectStatus){
    const project = this.projects.find(prj => prj.id === projectId);
    if(project && project.status !== newStatus){
      project.status = newStatus;
      // we need to update the listeners when we add or move a project
      this.updateListeners();
    }
  }
  // we loop through the listeners and we call the listenerFn with the updated projects
  private updateListeners(){
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

// Component Base Class
// we create a generic class to use the same structure for different components
// abstract class to be extended by other classes and not to be instantiated
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T; 
  element: U;
  
  constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string){
    this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;

    // we need to import the content of the template element
    const importedNode = document.importNode(this.templateElement.content, true);
    // access the concrete element of the imported content and store it in the element property
    this.element = importedNode.firstElementChild as U; // we know that the first element is a form element
    // we need to set the id of the form element so we can apply styles to it
    if(newElementId){
      this.element.id = newElementId;
    }

    this.attach(insertAtStart);
  }

  private attach(insertAtStart: boolean) {
    // beforend to add the element as the last child of the host element
    this.hostElement.insertAdjacentElement(insertAtStart ? 'afterbegin' : 'beforeend', this.element);
  }

  // abstract methods to be implemented by the child classes
  abstract configure(): void;
  abstract renderContent(): void;
}

// ProjectItem Class - to render a single project | we implement the Draggable interface
class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
  private project: Project;

  get persons() {
    return this.project.people === 1 ? '1 person' : `${this.project.people} persons`;
  }

 constructor(hostId: string, project: Project){
  super('single-project', hostId, false, project.id);
  this.project = project;

  this.configure();
  this.renderContent();
 }

 @autobind // we added Draggable=true to the index.html file
 dragStartHandler(event: DragEvent){
  // we need to set the data that we want to transfer with the drag event (the id of the project)
    event.dataTransfer!.setData('text/plain', this.project.id);
    // we need to set the effect of the drag event (move)
    event.dataTransfer!.effectAllowed = 'move';
 }

 dragEndHandler(_: DragEvent) {
     console.log('DragEnd');
 }

 configure(){
  this.element.addEventListener('dragstart', this.dragStartHandler);
  this.element.addEventListener('dragend', this.dragEndHandler);
 }

 // we render the single project by accessing the elements of the template and setting the values
 renderContent(){
  this.element.querySelector('h2')!.innerText = this.project.title;
  this.element.querySelector('h3')!.innerText = this.persons + ' assigned';
  this.element.querySelector('p')!.innerText = this.project.description;
 }

}

// ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
  assignedProjects: Project[];

  // we need to pass the type of the project list when we instantiate the class, as we have two different id css classes
  constructor(private type: 'active' | 'finished'){
    // we call the super method to pass the parameters to the parent class
    super('project-list', 'app', false, `${type}-projects`);
    this.assignedProjects = [];
    // we need to listen to the state changes
    this.configure();
    // render the content when the class is instantiated
    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent) {
    // we need to check if the data type of the dragged element is text/plain
    if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain'){
      // prvent the default behavior of the browser to avoid issues with the drop event
      event.preventDefault();
      const listEl = this.element.querySelector('ul')!;
      listEl.classList.add('droppable');
    }
  }

  @autobind
  dropHandler(event: DragEvent) {
      const prjId = event.dataTransfer!.getData('text/plain');
      projectState.moveProject(prjId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished);
  }

  @autobind
  dragLeaveHandler(_: DragEvent) {
    const listEl = this.element.querySelector('ul')!;
    listEl.classList.remove('droppable');
  }

    // we need to implement the abstract methods from the parent class
    configure() {
      this.element.addEventListener('dragover', this.dragOverHandler);
      this.element.addEventListener('dragleave', this.dragLeaveHandler);
      this.element.addEventListener('drop', this.dropHandler);

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
    }
  
     renderContent() {
      // we need to set the id of the ul element and the h2 title based on the type of the project list
      const listId = `${this.type}-projects-list`;
      this.element.querySelector('ul')!.id = listId;
      this.element.querySelector('h2')!.textContent = `${this.type.toUpperCase()} PROJECTS`;
    }

   private renderProjects() {
    const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
    // we need to clear the list before rendering the projects to avoid duplicates
    listEl.innerHTML = '';
    for (const prjItem of this.assignedProjects){
      // we create a new instance of the ProjectItem class and we pass the id of the ul element and the project
      new ProjectItem(this.element.querySelector('ul')!.id, prjItem);
    }
  }

}


// ProjectInput Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement>{
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;
  buttonElement: HTMLButtonElement;
  
  constructor() {
    // we call the super method to pass the parameters to the parent class
    super('project-input', 'app', true, 'user-input');
    // we access the input elements of the form and store them in the corresponding properties
    this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;
    this.buttonElement = this.element.querySelector('button') as HTMLButtonElement;

    // run the configure method to bind the submitHandler to the form element
    this.configure();
  }

  // we listen to the submit event of the form element and we bind the submitHandler to it
  configure() {
    // we need to bind the submitHandler to the submitHandler method
    this.element.addEventListener('submit', this.submitHandler);
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

  renderContent(){}; // we don't need to render anything in this class

}

// we instantiate the class and we can see the form in the browser
const prjInput = new ProjectInput();
// we instantiate the class and we can see both sections in the browser
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');
