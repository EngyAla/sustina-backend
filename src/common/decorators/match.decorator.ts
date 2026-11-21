import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';

export function Match(
    property: string,
    validationOptions?: ValidationOptions,
) {
    return (object: object, propertyName: string) => {
        registerDecorator({
            name: 'match',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [property],
            validator: {
                validate(value: unknown, args: ValidationArguments) {
                    const [relatedProperty] = args.constraints;

                    return (
                        typeof value === 'string' &&
                        value === (args.object as Record<string, unknown>)[relatedProperty]
                    );
                },
            },
        });
    };
}
