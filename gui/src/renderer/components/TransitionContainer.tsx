import * as React from 'react';
import styled from 'styled-components';
import { ITransitionGroupProps } from '../transitions';

interface ITransitioningViewProps {
  viewId: string;
}

type TransitioningView = React.ReactElement<ITransitioningViewProps>;

interface ITransitionQueueItem {
  view: TransitioningView;
  transition: ITransitionGroupProps;
}

interface IProps extends ITransitionGroupProps {
  children: TransitioningView;
  onTransitionEnd: () => void;
}

interface IItemStyle {
  // x and y are percentages
  x: number;
  y: number;
  inFront: boolean;
  duration?: number;
}

interface IState {
  currentItem?: ITransitionQueueItem;
  nextItem?: ITransitionQueueItem;
  itemQueue: ITransitionQueueItem[];
  currentItemStyle?: IItemStyle;
  nextItemStyle?: IItemStyle;
  currentItemTransition?: Partial<IItemStyle>;
  nextItemTransition?: Partial<IItemStyle>;
}

export const StyledTransitionContainer = styled.div(
  {},
  (props: { disableUserInteraction: boolean }) => ({
    flex: 1,
    pointerEvents: props.disableUserInteraction ? 'none' : undefined,
  }),
);

export const StyledTransitionContent = styled.div({}, (props: { transition?: IItemStyle }) => {
  const x = `${props.transition?.x ?? 0}%`;
  const y = `${props.transition?.y ?? 0}%`;
  const duration = props.transition?.duration ?? 450;

  return {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: props.transition?.inFront ? 1 : 0,
    transform: `translate(${x}, ${y})`,
    transition: `transform ${duration}ms ease-in-out`,
  };
});

export const StyledTransitionView = styled.div({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
});

export class TransitionView extends React.Component<ITransitioningViewProps> {
  public render() {
    return <StyledTransitionView>{this.props.children}</StyledTransitionView>;
  }
}

export default class TransitionContainer extends React.Component<IProps, IState> {
  public state: IState = {
    itemQueue: [],
    currentItem: TransitionContainer.makeItem(this.props),
  };

  private isCycling = false;

  private currentContentRef = React.createRef<HTMLDivElement>();
  private nextContentRef = React.createRef<HTMLDivElement>();

  public static getDerivedStateFromProps(props: IProps, state: IState) {
    const candidate = props.children;

    if (candidate && state.currentItem) {
      // synchronize updates to the last added child.
      const itemQueueCount = state.itemQueue.length;
      const lastItemInQueue = itemQueueCount > 0 ? state.itemQueue[itemQueueCount - 1] : undefined;

      if (lastItemInQueue && lastItemInQueue.view.props.viewId === candidate.props.viewId) {
        return {
          itemQueue: [...state.itemQueue.slice(0, -1), TransitionContainer.makeItem(props)],
        };
      } else if (
        itemQueueCount === 0 &&
        state.nextItem &&
        state.nextItem.view.props.viewId === candidate.props.viewId
      ) {
        return { nextItem: TransitionContainer.makeItem(props) };
      } else if (
        itemQueueCount === 0 &&
        !state.nextItem &&
        state.currentItem.view.props.viewId === candidate.props.viewId
      ) {
        return { currentItem: TransitionContainer.makeItem(props) };
      } else {
        // add new item
        return { itemQueue: [...state.itemQueue, TransitionContainer.makeItem(props)] };
      }
    } else if (candidate && !state.currentItem) {
      return { currentItem: TransitionContainer.makeItem(props) };
    } else {
      return null;
    }
  }

  public componentDidUpdate() {
    if (
      this.state.currentItemStyle &&
      this.state.currentItemTransition &&
      this.state.nextItemStyle &&
      this.state.nextItemTransition
    ) {
      this.setState((state) => ({
        currentItemStyle: Object.assign({}, state.currentItemStyle, state.currentItemTransition),
        nextItemStyle: Object.assign({}, state.nextItemStyle, state.nextItemTransition),
        currentItemTransition: undefined,
        nextItemTransition: undefined,
      }));
    } else {
      this.cycle();
    }
  }

  public render() {
    const disableUserInteraction =
      this.state.itemQueue.length > 0 || this.state.nextItem ? true : false;

    return (
      <StyledTransitionContainer disableUserInteraction={disableUserInteraction}>
        {this.state.currentItem && (
          <StyledTransitionContent
            key={this.state.currentItem.view.props.viewId}
            ref={this.currentContentRef}
            transition={this.state.currentItemStyle}
            onTransitionEnd={this.onTransitionEnd}>
            {this.state.currentItem.view}
          </StyledTransitionContent>
        )}

        {this.state.nextItem && (
          <StyledTransitionContent
            key={this.state.nextItem.view.props.viewId}
            ref={this.nextContentRef}
            transition={this.state.nextItemStyle}
            onTransitionEnd={this.onTransitionEnd}>
            {this.state.nextItem.view}
          </StyledTransitionContent>
        )}
      </StyledTransitionContainer>
    );
  }

  private onTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (
      this.isCycling &&
      (event.target === this.currentContentRef.current ||
        event.target === this.nextContentRef.current)
    ) {
      this.continueCycling();
    }
  };

  private cycle() {
    if (!this.isCycling) {
      this.isCycling = true;
      this.cycleUnguarded();
    }
  }

  private finishCycling() {
    this.isCycling = false;
    this.props.onTransitionEnd();
  }

  private continueCycling = () => {
    this.makeNextItemCurrent(this.cycleUnguarded);
  };

  private cycleUnguarded = () => {
    const itemQueue = this.state.itemQueue;

    if (itemQueue.length > 0) {
      const nextItem = itemQueue[0];
      const transition = nextItem.transition;

      switch (transition.name) {
        case 'slide-up':
          this.slideUp(transition.duration);
          break;

        case 'slide-down':
          this.slideDown(transition.duration);
          break;

        case 'push':
          this.push(transition.duration);
          break;

        case 'pop':
          this.pop(transition.duration);
          break;

        default:
          this.replace(this.cycleUnguarded);
          break;
      }
    } else {
      this.finishCycling();
    }
  };

  private static makeItem(props: IProps): ITransitionQueueItem {
    return {
      transition: {
        name: props.name,
        duration: props.duration,
      },
      view: React.cloneElement(props.children),
    };
  }

  private makeNextItemCurrent(completion: () => void) {
    this.setState(
      (state) => ({
        currentItem: state.nextItem,
        nextItem: undefined,
        currentItemStyle: undefined,
        nextItemStyle: undefined,
        currentItemTransition: undefined,
        nextItemTransition: undefined,
      }),
      completion,
    );
  }

  private slideUp(duration: number) {
    this.setState((state) => ({
      nextItem: state.itemQueue[0],
      itemQueue: state.itemQueue.slice(1),
      currentItemStyle: { x: 0, y: 0, inFront: false },
      nextItemStyle: { x: 0, y: 100, inFront: true },
      currentItemTransition: { duration },
      nextItemTransition: { y: 0, duration },
    }));
  }

  private slideDown(duration: number) {
    this.setState((state) => ({
      nextItem: state.itemQueue[0],
      itemQueue: state.itemQueue.slice(1),
      currentItemStyle: { x: 0, y: 0, inFront: true },
      nextItemStyle: { x: 0, y: 0, inFront: false },
      currentItemTransition: { y: 100, duration },
      nextItemTransition: { duration },
    }));
  }

  private push(duration: number) {
    this.setState((state) => ({
      nextItem: state.itemQueue[0],
      itemQueue: state.itemQueue.slice(1),
      currentItemStyle: { x: 0, y: 0, inFront: false },
      nextItemStyle: { x: 100, y: 0, inFront: true },
      currentItemTransition: { x: -50, duration },
      nextItemTransition: { x: 0, duration },
    }));
  }

  private pop(duration: number) {
    this.setState((state) => ({
      nextItem: state.itemQueue[0],
      itemQueue: state.itemQueue.slice(1),
      currentItemStyle: { x: 0, y: 0, inFront: true },
      nextItemStyle: { x: -50, y: 0, inFront: false },
      currentItemTransition: { x: 100, duration },
      nextItemTransition: { x: 0, duration },
    }));
  }

  private replace(completion: () => void) {
    this.setState(
      (state) => ({
        currentItem: state.itemQueue[0],
        nextItem: undefined,
        itemQueue: state.itemQueue.slice(1),
        currentItemStyle: { x: 0, y: 0, inFront: false, duration: 0 },
        nextItemStyle: { x: 0, y: 0, inFront: true, duration: 0 },
        currentItemTransition: undefined,
        nextItemTransition: undefined,
      }),
      completion,
    );
  }
}
