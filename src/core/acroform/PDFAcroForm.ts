import PDFContext from 'src/core/PDFContext';
import PDFDict from 'src/core/objects/PDFDict';
import PDFArray from 'src/core/objects/PDFArray';
import PDFName from 'src/core/objects/PDFName';
import PDFRef from 'src/core/objects/PDFRef';
import PDFAcroField from 'src/core/acroform/PDFAcroField';
import PDFAcroNonTerminal from 'src/core/acroform/PDFAcroNonTerminal';
import {
  createPDFAcroField,
  createPDFAcroFields,
} from 'src/core/acroform/utils';

class PDFAcroForm {
  readonly dict: PDFDict;

  static fromDict = (dict: PDFDict) => new PDFAcroForm(dict);

  static create = (context: PDFContext) => {
    const dict = context.obj({ Fields: [] });
    return new PDFAcroForm(dict);
  };

  private constructor(dict: PDFDict) {
    this.dict = dict;
  }

  Fields(): PDFArray | undefined {
    const fields = this.dict.lookup(PDFName.of('Fields'));
    if (fields instanceof PDFArray) return fields;
    return undefined;
  }

  getFields(): [PDFAcroField, PDFRef][] {
    const { Fields } = this.normalizedEntries();

    const fields = new Array(Fields.size());
    for (let idx = 0, len = Fields.size(); idx < len; idx++) {
      const ref = Fields.get(idx) as PDFRef;
      const dict = Fields.lookup(idx, PDFDict);
      // fields[idx] = PDFAcroField.fromDict(dict);
      fields[idx] = [createPDFAcroField(dict), ref];
    }

    return fields;
  }

  getAllFields(): [PDFAcroField, PDFRef][] {
    const allFields: [PDFAcroField, PDFRef][] = [];

    const pushFields = (fields?: [PDFAcroField, PDFRef][]) => {
      if (!fields) return;
      for (let idx = 0, len = fields.length; idx < len; idx++) {
        const field = fields[idx];
        allFields.push(field);
        // if (field instanceof PDFAcroNonTerminal) pushFields(field.getKids());
        const [fieldModel] = field;
        if (fieldModel instanceof PDFAcroNonTerminal) {
          pushFields(createPDFAcroFields(fieldModel.Kids()));
        }
      }
    };

    pushFields(this.getFields());

    return allFields;
  }

  addField(field: PDFRef) {
    const { Fields } = this.normalizedEntries();
    Fields?.push(field);
  }

  normalizedEntries() {
    let Fields = this.Fields();

    if (!Fields) {
      Fields = this.dict.context.obj([]);
      this.dict.set(PDFName.of('Fields'), Fields);
    }

    return { Fields };
  }
}

export default PDFAcroForm;
