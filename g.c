#include ""

#define load(pdta, n, section, data)                \
	for (int i = 0; i < n; i++)                       \
	{                                                 \
		pdta.section[i] = data + i * sizeof *(section); \
		data += sizeof(section)                         \
	}
int main()
{

	pdta_t pdta;
	load(pdta, phdr, data);
	load(pdta, pbag, data);
	load(pdta, pmod, data);
	load(pdta, pgen, data);
	load(pdta, ihdr, data);
	load(pdta, ibag, data);
	load(pdta, imod, data);
	load(pdta, igen, data);
	load(pdta, shdr, data);
	return pdta;
}
void query(char *name, int k, int v)
{
	for (int i = 0; i < pdex.npresets; i++)
	{
		//printf("%s %d", (pdtaa.phdrs + i)->name, (pdtaa.phdrs + i)->bagNdx);

		if (strstr((pdex.phdrs + i)->name, name))
		{
			pbag *pb = pdex.pbags + (pdex.phdrs + i)->bagNdx;
			pgen_t *pgen = pdex.pgens + pb->pgen_id;
			while (pgen++ != pdex.pgens + pdex.npgens)
			{
				printf("\n%s,%d",generator[pgen->operator],pgen->val.uAmount);
				if (pgen->operator== 41)
				{
				}
			}
		}
	}
	return 1;
}