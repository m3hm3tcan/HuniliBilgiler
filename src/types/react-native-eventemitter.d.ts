declare module 'react-native-eventemitter' {
    const EventEmitter: {
        on(event: string, listener: (...args: any[]) => void): void;
        off(event: string, listener: (...args: any[]) => void): void;
        emit(event: string, ...args: any[]): void;
    };
    export default EventEmitter;
}